from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


def enable_pgvector(apps, schema_editor):
    """Intenta habilitar la extensión pgvector en PostgreSQL de forma no bloqueante."""
    try:
        with schema_editor.connection.cursor() as cursor:
            cursor.execute("CREATE EXTENSION IF NOT EXISTS vector;")
    except Exception as e:
        print(f"[Aviso] No se pudo habilitar extensión 'vector' en PostgreSQL (se usará modo compatibilidad JSON): {e}")


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.RunPython(enable_pgvector, migrations.RunPython.noop),

        migrations.CreateModel(
            name='ConversacionIA',
            fields=[
                ('id', models.BigAutoField(primary_key=True, serialize=False)),
                ('titulo', models.CharField(default='Nueva consulta académica', max_length=255)),
                ('es_favorita', models.BooleanField(default=False)),
                ('fecha_creacion', models.DateTimeField(auto_now_add=True)),
                ('fecha_actualizacion', models.DateTimeField(auto_now=True)),
                ('usuario', models.ForeignKey(db_column='usuario_id', on_delete=django.db.models.deletion.CASCADE, related_name='conversaciones_ia', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'db_table': 'conversacion_ia',
                'ordering': ['-fecha_actualizacion'],
            },
        ),
        migrations.CreateModel(
            name='DocumentoIndexado',
            fields=[
                ('id', models.BigAutoField(primary_key=True, serialize=False)),
                ('estado', models.CharField(choices=[('pendiente', 'Pendiente'), ('indexando', 'Indexando'), ('indexado', 'Indexado'), ('error', 'Error')], default='pendiente', max_length=30)),
                ('total_paginas', models.IntegerField(default=0)),
                ('total_fragmentos', models.IntegerField(default=0)),
                ('checksum_sha256', models.CharField(blank=True, max_length=64, null=True)),
                ('fecha_indexacion', models.DateTimeField(blank=True, null=True)),
                ('mensaje_error', models.TextField(blank=True, null=True)),
                ('documento', models.OneToOneField(db_column='documento_id', on_delete=django.db.models.deletion.CASCADE, related_name='registro_indexado', to='publications.documentodigital')),
            ],
            options={
                'db_table': 'documento_indexado',
                'ordering': ['-fecha_indexacion', '-id'],
            },
        ),
        migrations.CreateModel(
            name='FragmentoDocumento',
            fields=[
                ('id', models.BigAutoField(primary_key=True, serialize=False)),
                ('numero_pagina', models.IntegerField(default=1)),
                ('orden_fragmento', models.IntegerField(default=1)),
                ('contenido', models.TextField()),
                ('embedding', models.JSONField(blank=True, help_text='Representación vectorial (768 dimensiones)', null=True)),
                ('tokens_aprox', models.IntegerField(default=0)),
                ('documento_indexado', models.ForeignKey(db_column='documento_indexado_id', on_delete=django.db.models.deletion.CASCADE, related_name='fragmentos', to='ai_assistant.documentoindexado')),
                ('publicacion', models.ForeignKey(db_column='publicacion_id', on_delete=django.db.models.deletion.CASCADE, related_name='fragmentos_ia', to='publications.publicacion')),
            ],
            options={
                'db_table': 'fragmento_documento',
                'ordering': ['numero_pagina', 'orden_fragmento'],
            },
        ),
        migrations.CreateModel(
            name='MensajeIA',
            fields=[
                ('id', models.BigAutoField(primary_key=True, serialize=False)),
                ('rol', models.CharField(choices=[('user', 'Usuario'), ('assistant', 'Asistente IA')], max_length=20)),
                ('contenido', models.TextField()),
                ('valoracion', models.CharField(blank=True, choices=[('like', 'Me gusta'), ('dislike', 'No me gusta')], max_length=20, null=True)),
                ('es_favorito', models.BooleanField(default=False)),
                ('fecha_envio', models.DateTimeField(auto_now_add=True)),
                ('conversacion', models.ForeignKey(db_column='conversacion_id', on_delete=django.db.models.deletion.CASCADE, related_name='mensajes', to='ai_assistant.conversacionia')),
            ],
            options={
                'db_table': 'mensaje_ia',
                'ordering': ['fecha_envio'],
            },
        ),
        migrations.CreateModel(
            name='FuenteMensajeIA',
            fields=[
                ('id', models.BigAutoField(primary_key=True, serialize=False)),
                ('numero_pagina', models.IntegerField(blank=True, null=True)),
                ('orden_cita', models.IntegerField(default=1)),
                ('texto_citado', models.TextField(blank=True, null=True)),
                ('cita_bibliografica', models.TextField(blank=True, null=True)),
                ('documento', models.ForeignKey(blank=True, db_column='documento_id', null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='citas_asistente', to='publications.documentodigital')),
                ('mensaje', models.ForeignKey(db_column='mensaje_id', on_delete=django.db.models.deletion.CASCADE, related_name='fuentes', to='ai_assistant.mensajeia')),
                ('publicacion', models.ForeignKey(db_column='publicacion_id', on_delete=django.db.models.deletion.CASCADE, related_name='citas_asistente', to='publications.publicacion')),
            ],
            options={
                'db_table': 'fuente_mensaje_ia',
                'ordering': ['orden_cita'],
            },
        ),
    ]
