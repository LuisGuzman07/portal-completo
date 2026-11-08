from rest_framework import serializers
from .models import (
    Autor,
    Categoria,
    DocumentoDigital,
    PalabraClave,
    Publicacion,
    PublicacionAutor,
    PublicacionCategoria,
    PublicacionPalabra,
    RevisionPublicacion,
    TipoDocumento,
    TipoPublicacion,
)
from apps.academics.models import Investigador, Miembro


class TipoPublicacionSerializer(serializers.ModelSerializer):
    class Meta:
        model = TipoPublicacion
        fields = ['id', 'nombre']


class TipoDocumentoSerializer(serializers.ModelSerializer):
    class Meta:
        model = TipoDocumento
        fields = ['id', 'nombre']


class CategoriaSerializer(serializers.ModelSerializer):
    area_nombre = serializers.ReadOnlyField(source='area.nombre')

    class Meta:
        model = Categoria
        fields = ['id', 'area', 'area_nombre', 'nombre', 'descripcion']


class PalabraClaveSerializer(serializers.ModelSerializer):
    class Meta:
        model = PalabraClave
        fields = ['id', 'termino']


class AutorSerializer(serializers.ModelSerializer):
    nombre_completo = serializers.ReadOnlyField()

    class Meta:
        model = Autor
        fields = ['id', 'investigador', 'nombres', 'apellidos', 'afiliacion', 'orcid', 'nombre_completo']


class PublicacionAutorItemSerializer(serializers.ModelSerializer):
    autor = AutorSerializer(read_only=True)
    autor_id = serializers.PrimaryKeyRelatedField(
        queryset=Autor.objects.all(), source='autor', write_only=True, required=False
    )

    class Meta:
        model = PublicacionAutor
        fields = ['id', 'autor', 'autor_id', 'orden', 'es_correspondencia']


class DocumentoDigitalSerializer(serializers.ModelSerializer):
    tipo_nombre = serializers.ReadOnlyField(source='tipo.nombre')
    cargado_por_email = serializers.ReadOnlyField(source='cargado_por.email')
    cargado_por_nombre = serializers.SerializerMethodField()
    nivel_acceso = serializers.ChoiceField(choices=DocumentoDigital.NIVELES_ACCESO, required=False)

    class Meta:
        model = DocumentoDigital
        fields = [
            'id',
            'publicacion',
            'tipo',
            'tipo_nombre',
            'titulo',
            'nombre_original',
            'mime',
            'tamano_bytes',
            'checksum_sha256',
            'nivel_acceso',
            'fecha_carga',
            'cargado_por_email',
            'cargado_por_nombre',
        ]
        read_only_fields = [
            'id',
            'ruta_privada',
            'mime',
            'tamano_bytes',
            'checksum_sha256',
            'fecha_carga',
            'cargado_por',
        ]

    def get_cargado_por_nombre(self, obj):
        if obj.cargado_por:
            return f'{obj.cargado_por.nombres} {obj.cargado_por.apellidos}'.strip()
        return None


class RevisionPublicacionSerializer(serializers.ModelSerializer):
    revisor_email = serializers.ReadOnlyField(source='revisor.email')
    revisor_nombre = serializers.SerializerMethodField()

    class Meta:
        model = RevisionPublicacion
        fields = [
            'id',
            'publicacion',
            'revisor',
            'revisor_email',
            'revisor_nombre',
            'tipo_revision',
            'observaciones',
            'resultado_propuesto',
            'fecha_revision',
        ]
        read_only_fields = ['id', 'revisor', 'fecha_revision']

    def get_revisor_nombre(self, obj):
        if obj.revisor:
            return f'{obj.revisor.nombres} {obj.revisor.apellidos}'.strip()
        return None


class PublicacionListSerializer(serializers.ModelSerializer):
    tipo_nombre = serializers.ReadOnlyField(source='tipo.nombre')
    registrada_por_email = serializers.ReadOnlyField(source='registrada_por.email')
    registrada_por_nombre = serializers.SerializerMethodField()
    autores_lista = serializers.SerializerMethodField()
    categorias_lista = serializers.SerializerMethodField()
    palabras_clave_lista = serializers.SerializerMethodField()
    documentos_count = serializers.SerializerMethodField()

    class Meta:
        model = Publicacion
        fields = [
            'id',
            'tipo',
            'tipo_nombre',
            'titulo',
            'resumen',
            'anio',
            'doi',
            'estado',
            'fecha_registro',
            'fecha_publicacion',
            'registrada_por_email',
            'registrada_por_nombre',
            'autores_lista',
            'categorias_lista',
            'palabras_clave_lista',
            'documentos_count',
        ]

    def get_registrada_por_nombre(self, obj):
        if obj.registrada_por:
            return f'{obj.registrada_por.nombres} {obj.registrada_por.apellidos}'.strip()
        return None

    def get_autores_lista(self, obj):
        return [
            {
                'id': pa.autor.id,
                'nombres': pa.autor.nombres,
                'apellidos': pa.autor.apellidos,
                'nombre_completo': pa.autor.nombre_completo,
                'afiliacion': pa.autor.afiliacion,
                'investigador_id': pa.autor.investigador_id,
                'orden': pa.orden,
                'es_correspondencia': pa.es_correspondencia,
            }
            for pa in obj.autores_relacion.select_related('autor')
        ]

    def get_categorias_lista(self, obj):
        return [
            {
                'id': c.id,
                'nombre': c.nombre,
                'area_id': c.area_id,
                'area_nombre': c.area.nombre if c.area else None,
            }
            for c in obj.categorias.select_related('area')
        ]

    def get_palabras_clave_lista(self, obj):
        return [p.termino for p in obj.palabras_clave.all()]

    def get_documentos_count(self, obj):
        return obj.documentos.count()


class PublicacionDetailSerializer(PublicacionListSerializer):
    documentos = DocumentoDigitalSerializer(many=True, read_only=True)
    revisiones = RevisionPublicacionSerializer(many=True, read_only=True)

    class Meta(PublicacionListSerializer.Meta):
        fields = PublicacionListSerializer.Meta.fields + [
            'referencias',
            'documentos',
            'revisiones',
        ]


class DocumentoRepositorioSerializer(serializers.ModelSerializer):
    tipo_nombre = serializers.ReadOnlyField(source='tipo.nombre')

    class Meta:
        model = DocumentoDigital
        fields = ['id', 'publicacion', 'tipo', 'tipo_nombre', 'titulo', 'nombre_original', 'mime', 'tamano_bytes', 'nivel_acceso', 'fecha_carga']


class RevisionPropietarioSerializer(serializers.ModelSerializer):
    class Meta:
        model = RevisionPublicacion
        fields = ['id', 'tipo_revision', 'observaciones', 'resultado_propuesto', 'fecha_revision']


class PublicacionPublicaListSerializer(PublicacionListSerializer):
    class Meta(PublicacionListSerializer.Meta):
        fields = [field for field in PublicacionListSerializer.Meta.fields if field != 'registrada_por_email']

    def get_documentos_count(self, obj):
        request = self.context.get('request')
        access = self._document_access(request.user if request else None, obj)
        return obj.documentos.filter(nivel_acceso__in=access).count()

    @staticmethod
    def _document_access(user, publication):
        if not user or not user.is_authenticated:
            return ['publico']
        if (
            user.is_superuser
            or user.has_role('superadmin')
            or user.has_role('admin_academico')
            or user.has_role('comite_academico')
            or publication.registrada_por_id == user.id
            or publication.autores.filter(investigador__perfil_academico__usuario_id=user.id).exists()
        ):
            return ['publico', 'miembros', 'restringido']
        has_active_membership = Miembro.objects.filter(usuario_id=user.id, estado='activo').exists()
        has_active_investigator = Investigador.objects.filter(
            perfil_academico__usuario_id=user.id,
            estado='activo',
        ).exists()
        return ['publico', 'miembros'] if has_active_membership or has_active_investigator else ['publico']


class PublicacionPublicaDetailSerializer(PublicacionPublicaListSerializer):
    documentos = serializers.SerializerMethodField()
    es_propietario = serializers.SerializerMethodField()

    class Meta(PublicacionPublicaListSerializer.Meta):
        fields = PublicacionPublicaListSerializer.Meta.fields + [
            'referencias', 'documentos', 'es_propietario',
        ]

    def get_es_propietario(self, obj):
        request = self.context.get('request')
        return bool(
            request
            and request.user.is_authenticated
            and (
                obj.registrada_por_id == request.user.id
                or obj.autores.filter(
                    investigador__perfil_academico__usuario_id=request.user.id
                ).exists()
            )
        )

    def get_documentos(self, obj):
        request = self.context.get('request')
        access = self._document_access(request.user if request else None, obj)
        documents = obj.documentos.filter(nivel_acceso__in=access).select_related('tipo')
        return DocumentoRepositorioSerializer(documents, many=True).data


class PublicacionPropietarioDetailSerializer(PublicacionPublicaDetailSerializer):
    revisiones = RevisionPropietarioSerializer(many=True, read_only=True)

    class Meta(PublicacionPublicaDetailSerializer.Meta):
        fields = PublicacionPublicaDetailSerializer.Meta.fields + ['revisiones']


class PublicacionCreateUpdateSerializer(serializers.ModelSerializer):
    categoria_ids = serializers.ListField(
        child=serializers.IntegerField(), required=False, write_only=True
    )
    palabras_clave = serializers.ListField(
        child=serializers.CharField(max_length=120), required=False, write_only=True
    )
    investigador_id = serializers.IntegerField(required=False, write_only=True, allow_null=True)
    autores_data = serializers.ListField(required=False, write_only=True)

    class Meta:
        model = Publicacion
        fields = [
            'id',
            'tipo',
            'titulo',
            'resumen',
            'anio',
            'doi',
            'referencias',
            'estado',
            'fecha_publicacion',
            'categoria_ids',
            'palabras_clave',
            'investigador_id',
            'autores_data',
        ]
        read_only_fields = ['id', 'estado']

    def validate_titulo(self, value):
        v = value.strip()
        if not v:
            raise serializers.ValidationError('El título de la publicación es obligatorio.')
        return v

    def validate_anio(self, value):
        if value is not None and (value < 1800 or value > 2200):
            raise serializers.ValidationError('El año debe encontrarse entre 1800 y 2200.')
        return value

    def create(self, validated_data):
        validated_data.pop('categoria_ids', None)
        validated_data.pop('palabras_clave', None)
        validated_data.pop('investigador_id', None)
        validated_data.pop('autores_data', None)
        return super().create(validated_data)

    def update(self, instance, validated_data):
        validated_data.pop('categoria_ids', None)
        validated_data.pop('palabras_clave', None)
        validated_data.pop('investigador_id', None)
        validated_data.pop('autores_data', None)
        return super().update(instance, validated_data)
