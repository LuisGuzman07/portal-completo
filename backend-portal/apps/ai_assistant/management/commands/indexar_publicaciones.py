from django.core.management.base import BaseCommand
from apps.ai_assistant.services.indexer import DocumentIndexerService


class Command(BaseCommand):
    help = 'Indexa los documentos PDF de las publicaciones aprobadas en el repositorio para el Asistente IA (CU28).'

    def add_arguments(self, parser):
        parser.add_argument(
            '--force',
            action='store_true',
            help='Fuerza la reindexación de documentos previamente indexados.',
        )

    def handle(self, *args, **options):
        force = options['force']
        self.stdout.write(self.style.NOTICE('Iniciando indexación de publicaciones aprobadas de ABOCCRIM...'))

        stats = DocumentIndexerService.index_all_approved_publications(force=force)

        self.stdout.write(self.style.SUCCESS(
            f"Proceso completado:\n"
            f" - Publicaciones analizadas: {stats['publicaciones_analizadas']}\n"
            f" - Documentos procesados: {stats['documentos_procesados']}\n"
            f" - Indexados exitosamente: {stats['indexados_exitosamente']}\n"
            f" - Con errores: {stats['con_errores']}"
        ))
