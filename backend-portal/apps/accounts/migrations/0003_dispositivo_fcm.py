from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0002_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='DispositivoFCM',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('fcm_token', models.CharField(max_length=255, unique=True)),
                ('dispositivo', models.CharField(blank=True, default='', max_length=100)),
                ('fecha_registro', models.DateTimeField(auto_now_add=True)),
                ('ultimo_uso', models.DateTimeField(auto_now=True)),
                ('usuario', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='dispositivos_fcm', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'verbose_name': 'Dispositivo FCM',
                'verbose_name_plural': 'Dispositivos FCM',
                'db_table': 'dispositivo_fcm',
            },
        ),
    ]
