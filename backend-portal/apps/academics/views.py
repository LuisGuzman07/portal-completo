from django.db import connection, transaction
from django.db.models import Count, Q
from django.utils import timezone
from rest_framework import generics, status, views
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from apps.audit.models import RegistroAuditoria, registrar_auditoria
from .models import AreaTematica, CategoriaMiembro, Investigador, Miembro, PerfilAcademico
from .permissions import CanManageInvestigators, CanManageMembers
from .serializers import (
    AreaTematicaCreateSerializer,
    AreaTematicaSerializer,
    InvestigadorAdminSerializer,
    InvestigadorDetalleSerializer,
    InvestigadorListSerializer,
    InvestigadorPublicoDetalleSerializer,
    InvestigadorPublicoSerializer,
    CategoriaMiembroSerializer,
    MiembroSerializer,
    PerfilAcademicoSerializer,
    PerfilDisponibleSerializer,
)


class MiembroListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated, CanManageMembers]
    serializer_class = MiembroSerializer

    def get_queryset(self):
        queryset = Miembro.objects.select_related('usuario', 'categoria')
        search = self.request.query_params.get('search', '').strip()
        if search:
            queryset = queryset.filter(
                Q(usuario__nombres__icontains=search)
                | Q(usuario__apellidos__icontains=search)
                | Q(usuario__email__icontains=search)
                | Q(categoria__nombre__icontains=search)
            )
        estado = self.request.query_params.get('estado', '').strip()
        categoria = self.request.query_params.get('categoria', '').strip()
        if estado:
            queryset = queryset.filter(estado=estado)
        if categoria.isdigit():
            queryset = queryset.filter(categoria_id=int(categoria))
        return queryset

    @transaction.atomic
    def perform_create(self, serializer):
        miembro = serializer.save()
        registrar_auditoria(
            request=self.request, accion='CREAR_MIEMBRO', entidad='Miembro',
            registro_afectado_id=miembro.id,
            detalle=f'Membresía registrada para {miembro.usuario.email} (categoría={miembro.categoria.nombre}, estado={miembro.estado}).',
        )


class MiembroDetailView(generics.RetrieveUpdateAPIView):
    permission_classes = [IsAuthenticated, CanManageMembers]
    queryset = Miembro.objects.select_related('usuario', 'categoria')
    serializer_class = MiembroSerializer

    @transaction.atomic
    def perform_update(self, serializer):
        miembro = serializer.save()
        registrar_auditoria(
            request=self.request, accion='ACTUALIZAR_MIEMBRO', entidad='Miembro',
            registro_afectado_id=miembro.id,
            detalle=f'Membresía actualizada para {miembro.usuario.email} (categoría={miembro.categoria.nombre}, estado={miembro.estado}).',
        )


class CategoriasMiembroListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated, CanManageMembers]
    serializer_class = CategoriaMiembroSerializer

    def get_queryset(self):
        return CategoriaMiembro.objects.annotate(miembros_count=Count('miembros'))

    @transaction.atomic
    def perform_create(self, serializer):
        categoria = serializer.save()
        registrar_auditoria(
            request=self.request, accion='CREAR_CATEGORIA_MIEMBRO', entidad='CategoriaMiembro',
            registro_afectado_id=categoria.id, detalle=f'Categoría creada: {categoria.nombre}.',
        )


class CategoriaMiembroDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAuthenticated, CanManageMembers]
    queryset = CategoriaMiembro.objects.annotate(miembros_count=Count('miembros'))
    serializer_class = CategoriaMiembroSerializer

    def perform_update(self, serializer):
        categoria = serializer.save()
        registrar_auditoria(
            request=self.request, accion='ACTUALIZAR_CATEGORIA_MIEMBRO', entidad='CategoriaMiembro',
            registro_afectado_id=categoria.id, detalle=f'Categoría actualizada: {categoria.nombre}.',
        )

    def destroy(self, request, *args, **kwargs):
        categoria = self.get_object()
        if categoria.miembros.exists():
            return Response({'detail': 'No se puede eliminar una categoría que tiene miembros asociados.'}, status=status.HTTP_409_CONFLICT)
        pk = categoria.pk
        categoria.delete()
        registrar_auditoria(
            request=request, accion='ELIMINAR_CATEGORIA_MIEMBRO', entidad='CategoriaMiembro',
            registro_afectado_id=pk, detalle=f'Categoría eliminada (id={pk}).',
        )
        return Response(status=status.HTTP_204_NO_CONTENT)


class UsuariosDisponiblesMiembroView(generics.ListAPIView):
    permission_classes = [IsAuthenticated, CanManageMembers]

    def get(self, request, *args, **kwargs):
        from apps.accounts.models import Usuario
        usuarios = Usuario.objects.exclude(membresia__isnull=False).order_by('apellidos', 'nombres')
        search = request.query_params.get('search', '').strip()
        if search:
            usuarios = usuarios.filter(
                Q(nombres__icontains=search) | Q(apellidos__icontains=search) | Q(email__icontains=search)
            )
        return Response([{
            'id': user.id,
            'nombres': user.nombres,
            'apellidos': user.apellidos,
            'email': user.email,
            'activo': user.activo,
        } for user in usuarios[:100]])


class MiPerfilAcademicoView(views.APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        perfil = PerfilAcademico.objects.filter(usuario_id=request.user.id).first()
        return Response(self._profile_payload(perfil))

    @transaction.atomic
    def put(self, request):
        return self._save(request, partial=False)

    @transaction.atomic
    def patch(self, request):
        return self._save(request, partial=True)

    @staticmethod
    def _profile_payload(perfil):
        investigator = (
            Investigador.objects.prefetch_related('areas').filter(perfil_academico=perfil).first()
            if perfil else None
        )
        investigator_data = InvestigadorListSerializer(investigator).data if investigator else None
        if investigator_data and investigator.estado in ('observado', 'rechazado'):
            audit_entry = RegistroAuditoria.objects.filter(
                entidad='Investigador',
                registro_afectado_id=str(investigator.id),
                accion='ACTUALIZAR_INVESTIGADOR',
                detalle__contains='OBSERVACION_REVISION: ',
                ).first()
            if audit_entry:
                investigator_data['observacion_revision'] = audit_entry.detalle.rsplit(
                    'OBSERVACION_REVISION: ', 1
                )[-1]
        return {
            'profile': PerfilAcademicoSerializer(perfil).data if perfil else None,
            'investigator': investigator_data,
        }

    def _save(self, request, partial):
        perfil = PerfilAcademico.objects.filter(usuario_id=request.user.id).first()
        creating = perfil is None
        serializer = PerfilAcademicoSerializer(
            perfil,
            data=request.data,
            partial=partial,
        )
        serializer.is_valid(raise_exception=True)
        perfil = serializer.save(
            usuario=request.user,
            fecha_actualizacion=timezone.now(),
        )

        registrar_auditoria(
            request=request,
            usuario=request.user,
            accion='PERFIL_ACADEMICO_CREADO' if creating else 'PERFIL_ACADEMICO_ACTUALIZADO',
            entidad='PerfilAcademico',
            registro_afectado_id=perfil.id,
            detalle=f"Perfil académico {'creado' if creating else 'actualizado'} por {request.user.email}",
        )
        return Response(
            self._profile_payload(perfil),
            status=status.HTTP_201_CREATED if creating else status.HTTP_200_OK,
        )


class SolicitarDirectorioInvestigadorView(views.APIView):
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request):
        perfil = PerfilAcademico.objects.select_for_update().filter(usuario_id=request.user.id).first()
        if not perfil:
            return Response(
                {'detail': 'Primero guarda tu perfil académico en CU06.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        required_fields = {
            'grado_academico': 'grado académico',
            'institucion': 'institución',
            'especialidad': 'especialidad',
            'biografia': 'biografía académica',
        }
        missing = [label for field, label in required_fields.items() if not (getattr(perfil, field) or '').strip()]
        if missing:
            return Response(
                {'detail': f'Completa estos datos antes de solicitar la inclusión: {", ".join(missing)}.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        investigador = Investigador.objects.select_for_update().filter(perfil_academico=perfil).first()
        if investigador and investigador.estado in ('pendiente', 'activo'):
            message = (
                'Tu solicitud ya está pendiente de revisión.'
                if investigador.estado == 'pendiente'
                else 'Ya formas parte del directorio de investigadores.'
            )
            return Response({'detail': message}, status=status.HTTP_409_CONFLICT)

        if investigador:
            investigador.estado = 'pendiente'
            investigador.fecha_alta = None
            investigador.visible_directorio = False
            investigador.save(update_fields=['estado', 'fecha_alta', 'visible_directorio'])
            action = 'SOLICITAR_NUEVAMENTE'
        else:
            investigador = Investigador.objects.create(
                perfil_academico=perfil,
                estado='pendiente',
                visible_directorio=False,
            )
            action = 'SOLICITAR'

        registrar_auditoria(
            request=request,
            usuario=request.user,
            accion='SOLICITAR_DIRECTORIO_INVESTIGADOR',
            entidad='Investigador',
            registro_afectado_id=investigador.id,
            detalle=f"Solicitud de inclusión al directorio ({action}) por {request.user.email}",
        )
        return Response({
            'message': 'Solicitud enviada. El administrador académico revisará tu perfil.',
            'investigator': InvestigadorListSerializer(investigador).data,
        }, status=status.HTTP_201_CREATED)


class InvestigadorListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated, CanManageInvestigators]

    def get_queryset(self):
        queryset = Investigador.objects.select_related(
            'perfil_academico', 'perfil_academico__usuario'
        ).prefetch_related('areas')

        search = self.request.query_params.get('search', '').strip()
        if search:
            queryset = queryset.filter(
                Q(perfil_academico__usuario__nombres__icontains=search)
                | Q(perfil_academico__usuario__apellidos__icontains=search)
                | Q(perfil_academico__usuario__email__icontains=search)
                | Q(perfil_academico__especialidad__icontains=search)
                | Q(areas__nombre__icontains=search)
            ).distinct()

        estado = self.request.query_params.get('estado', '').strip()
        if estado:
            queryset = queryset.filter(estado=estado)
        return queryset.order_by('perfil_academico__usuario__apellidos', 'perfil_academico__usuario__nombres')

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return InvestigadorAdminSerializer
        return InvestigadorListSerializer

    @transaction.atomic
    def perform_create(self, serializer):
        investigador = serializer.save()
        registrar_auditoria(
            request=self.request,
            usuario=self.request.user,
            accion='CREAR_INVESTIGADOR',
            entidad='Investigador',
            registro_afectado_id=investigador.id,
            detalle=f'Investigador registrado para perfil académico {investigador.perfil_academico_id}',
        )


class InvestigadorDetailView(generics.RetrieveUpdateAPIView):
    permission_classes = [IsAuthenticated, CanManageInvestigators]
    queryset = Investigador.objects.select_related(
        'perfil_academico', 'perfil_academico__usuario'
    ).prefetch_related('areas')

    def get_serializer_class(self):
        if self.request.method in ('GET', 'HEAD', 'OPTIONS'):
            return InvestigadorDetalleSerializer
        return InvestigadorAdminSerializer

    @transaction.atomic
    def perform_update(self, serializer):
        review_note = (serializer.validated_data.get('observacion_revision') or '').strip()
        investigador = serializer.save()
        detail = f'Investigador actualizado (estado={investigador.estado}, visible={investigador.visible_directorio})'
        if review_note:
            detail += f' | OBSERVACION_REVISION: {review_note}'
        registrar_auditoria(
            request=self.request,
            usuario=self.request.user,
            accion='ACTUALIZAR_INVESTIGADOR',
            entidad='Investigador',
            registro_afectado_id=investigador.id,
            detalle=detail,
        )


class InvestigadoresPublicosView(generics.ListAPIView):
    permission_classes = [AllowAny]
    serializer_class = InvestigadorPublicoSerializer

    def get_queryset(self):
        queryset = Investigador.objects.filter(
            estado='activo', visible_directorio=True
        ).select_related(
            'perfil_academico', 'perfil_academico__usuario'
        ).prefetch_related('areas')

        search = self.request.query_params.get('search', '').strip()
        if search:
            for term in search.split():
                queryset = queryset.filter(
                    Q(perfil_academico__usuario__nombres__icontains=term)
                    | Q(perfil_academico__usuario__apellidos__icontains=term)
                    | Q(perfil_academico__grado_academico__icontains=term)
                    | Q(perfil_academico__institucion__icontains=term)
                    | Q(perfil_academico__especialidad__icontains=term)
                    | Q(areas__nombre__icontains=term)
                ).distinct()

        area_id = self.request.query_params.get('area', '').strip()
        if area_id:
            if not area_id.isdigit():
                return queryset.none()
            queryset = queryset.filter(areas__id=int(area_id))

        return queryset.order_by(
            'perfil_academico__usuario__apellidos',
            'perfil_academico__usuario__nombres',
        )


class InvestigadorPublicoDetalleView(views.APIView):
    permission_classes = [AllowAny]

    def get(self, request, pk):
        investigador = Investigador.objects.filter(
            pk=pk, estado='activo', visible_directorio=True
        ).select_related(
            'perfil_academico', 'perfil_academico__usuario'
        ).prefetch_related('areas').first()
        if not investigador:
            return Response({'detail': 'El perfil no está disponible en el directorio.'}, status=status.HTTP_404_NOT_FOUND)

        data = InvestigadorPublicoDetalleSerializer(investigador).data
        with connection.cursor() as cursor:
            cursor.execute(
                """
                SELECT DISTINCT p.id, p.titulo, p.resumen, p.anio, p.doi, p.fecha_publicacion
                FROM publicacion p
                INNER JOIN publicacion_autor pa ON pa.publicacion_id = p.id
                INNER JOIN autor a ON a.id = pa.autor_id
                WHERE a.investigador_id = %s
                  AND p.estado IN ('publicada', 'publicado', 'aprobada', 'aprobado')
                  AND p.fecha_publicacion IS NOT NULL
                ORDER BY p.fecha_publicacion DESC, p.titulo
                """,
                [investigador.id],
            )
            columns = [column[0] for column in cursor.description]
            data['publicaciones'] = [dict(zip(columns, row)) for row in cursor.fetchall()]
        return Response(data)


class AreasTematicasPublicasView(generics.ListAPIView):
    permission_classes = [AllowAny]
    serializer_class = AreaTematicaSerializer
    queryset = AreaTematica.objects.filter(
        investigadores__estado='activo',
        investigadores__visible_directorio=True,
    ).annotate(
        investigadores_count=Count('investigadores', distinct=True)
    ).order_by('nombre').distinct()


class PerfilesDisponiblesInvestigadorView(views.APIView):
    permission_classes = [IsAuthenticated, CanManageInvestigators]

    def get(self, request):
        queryset = PerfilAcademico.objects.select_related('usuario').filter(
            registro_investigador__isnull=True
        )
        search = request.query_params.get('search', '').strip()
        if search:
            queryset = queryset.filter(
                Q(usuario__nombres__icontains=search)
                | Q(usuario__apellidos__icontains=search)
                | Q(usuario__email__icontains=search)
                | Q(especialidad__icontains=search)
            )
        queryset = queryset.order_by('usuario__apellidos', 'usuario__nombres')[:200]
        return Response(PerfilDisponibleSerializer(queryset, many=True).data)


class AreaTematicaListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated, CanManageInvestigators]
    queryset = AreaTematica.objects.annotate(
        investigadores_count=Count('investigadores', distinct=True)
    ).order_by('nombre')

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return AreaTematicaCreateSerializer
        return AreaTematicaSerializer

    @transaction.atomic
    def perform_create(self, serializer):
        area = serializer.save()
        registrar_auditoria(
            request=self.request,
            usuario=self.request.user,
            accion='CREAR_AREA_TEMATICA',
            entidad='AreaTematica',
            registro_afectado_id=area.id,
            detalle=f'Área temática creada: {area.nombre}',
        )


class AreaTematicaDetailView(generics.RetrieveUpdateAPIView):
    permission_classes = [IsAuthenticated, CanManageInvestigators]
    queryset = AreaTematica.objects.annotate(investigadores_count=Count('investigadores', distinct=True))
    serializer_class = AreaTematicaCreateSerializer

    @transaction.atomic
    def perform_update(self, serializer):
        area = serializer.save()
        registrar_auditoria(
            request=self.request,
            usuario=self.request.user,
            accion='ACTUALIZAR_AREA_TEMATICA',
            entidad='AreaTematica',
            registro_afectado_id=area.id,
            detalle=f'Área temática actualizada: {area.nombre}',
        )
