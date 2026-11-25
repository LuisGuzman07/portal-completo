from django.apps import AppConfig


class AIAssistantConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.ai_assistant'
    verbose_name = 'Asistente Académico IA (CU28)'

    def ready(self):
        import apps.ai_assistant.signals  # noqa
