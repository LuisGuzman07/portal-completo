import React, { useEffect, useState } from 'react';
import { academicProfileService } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const EMPTY_PROFILE = {
  grado_academico: '',
  institucion: '',
  especialidad: '',
  biografia: '',
  orcid: '',
};

const FIELDS = [
  { name: 'grado_academico', label: 'Grado académico', placeholder: 'Ej. Maestría en Criminología' },
  { name: 'institucion', label: 'Institución', placeholder: 'Universidad u organización' },
  { name: 'especialidad', label: 'Especialidad', placeholder: 'Área de especialización' },
  { name: 'orcid', label: 'ORCID (opcional)', placeholder: '0000-0000-0000-0000' },
];

export default function AcademicProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(EMPTY_PROFILE);
  const [savedProfile, setSavedProfile] = useState(EMPTY_PROFILE);
  const [hasProfile, setHasProfile] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [investigator, setInvestigator] = useState(null);
  const [profileDirty, setProfileDirty] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [updatedAt, setUpdatedAt] = useState(null);

  useEffect(() => {
    let active = true;
    academicProfileService.getMine()
      .then(({ profile: savedProfile, investigator: investigatorRecord }) => {
        if (active) setInvestigator(investigatorRecord);
        if (!active) return;
        if (!savedProfile) {
          setEditingProfile(true);
          return;
        }
        const { fecha_actualizacion, ...editableFields } = savedProfile;
        const loadedProfile = { ...EMPTY_PROFILE, ...editableFields };
        setProfile(loadedProfile);
        setSavedProfile(loadedProfile);
        setHasProfile(true);
        setProfileDirty(false);
        setUpdatedAt(fecha_actualizacion);
      })
      .catch(() => {
        if (active) setError('No se pudo cargar tu perfil académico. Intenta nuevamente.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setProfile((current) => ({ ...current, [name]: value }));
    setProfileDirty(true);
    setError('');
    setNotice('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setNotice('');
    try {
      const { profile: savedProfile, investigator: investigatorRecord } = await academicProfileService.saveMine(profile);
      const { fecha_actualizacion, ...editableFields } = savedProfile;
      const loadedProfile = { ...EMPTY_PROFILE, ...editableFields };
      setProfile(loadedProfile);
      setSavedProfile(loadedProfile);
      setHasProfile(true);
      setEditingProfile(false);
      setProfileDirty(false);
      setInvestigator(investigatorRecord);
      setUpdatedAt(fecha_actualizacion);
      setNotice('Tu perfil académico se guardó correctamente.');
    } catch (requestError) {
      const details = requestError.data;
      if (details && typeof details === 'object' && details.orcid) {
        setError(Array.isArray(details.orcid) ? details.orcid.join(' ') : String(details.orcid));
      } else {
        setError(requestError.message || 'No se pudo guardar el perfil.');
      }
    } finally {
      setSaving(false);
    }
  };

  const completeForDirectory = ['grado_academico', 'institucion', 'especialidad', 'biografia']
    .every((field) => (profile[field] || '').trim());
  const canEditProfile = !investigator || ['observado', 'rechazado', 'inactivo'].includes(investigator.estado);

  const cancelEditing = () => {
    setProfile(savedProfile);
    setProfileDirty(false);
    setEditingProfile(false);
    setError('');
  };

  const requestDirectory = async () => {
    setRequesting(true);
    setError('');
    setNotice('');
    try {
      const result = await academicProfileService.requestInvestigatorDirectory();
      setInvestigator(result.investigator);
      setNotice(result.message);
    } catch (requestError) {
      setError(requestError.data?.detail || requestError.message || 'No se pudo enviar la solicitud.');
    } finally {
      setRequesting(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-sm text-on-surface-variant">Cargando perfil académico…</div>;
  }

  return (
    <section className="max-w-4xl space-y-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-secondary">CU06 · Perfil académico</p>
        <h1 className="mt-2 text-2xl font-bold text-primary">Mi perfil académico</h1>
        <p className="mt-2 text-sm text-on-surface-variant">
          Completa la información académica que quieres mantener asociada a tu cuenta.
        </p>
      </div>

      <div className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-5 md:p-7">
        <div className="mb-6 border-b border-outline-variant/20 pb-4">
          <h2 className="font-bold text-primary">{user?.nombres} {user?.apellidos}</h2>
          <p className="mt-1 text-sm text-on-surface-variant">{user?.email}</p>
          <p className="mt-2 text-xs text-outline">
            {hasProfile ? 'Perfil registrado' : 'Aún no has registrado información académica.'}
            {updatedAt && ` · Actualizado ${new Date(updatedAt).toLocaleString('es-BO')}`}
          </p>
        </div>

        {error && <p role="alert" className="mb-4 rounded-lg bg-error-container/50 px-4 py-3 text-sm text-error">{error}</p>}
        {notice && <p role="status" className="mb-4 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{notice}</p>}

        {hasProfile && !editingProfile && (
          <section className="mb-6 rounded-xl border border-outline-variant/30 bg-white p-5 md:p-6">
            <div className="mb-5 flex flex-wrap items-start justify-between gap-3 border-b border-outline-variant/20 pb-4">
              <div><h3 className="text-lg font-bold text-primary">Información académica</h3><p className="mt-1 text-xs text-outline">Este es el perfil que verá el equipo revisor.</p></div>
              {canEditProfile ? (
                <button type="button" onClick={() => { setEditingProfile(true); setNotice(''); }} className="inline-flex items-center gap-2 rounded-lg border border-outline-variant/40 px-3.5 py-2 text-sm font-bold text-primary hover:bg-surface-container-low"><span className="material-symbols-outlined text-lg">edit</span>Editar perfil</button>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-900"><span className="material-symbols-outlined text-base">lock</span>Edición bloqueada durante la revisión</span>
              )}
            </div>
            <dl className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
              <div><dt className="text-xs font-bold uppercase tracking-wide text-outline">Grado académico</dt><dd className="mt-1 text-sm font-medium text-on-surface">{profile.grado_academico || 'No registrado'}</dd></div>
              <div><dt className="text-xs font-bold uppercase tracking-wide text-outline">Institución</dt><dd className="mt-1 text-sm font-medium text-on-surface">{profile.institucion || 'No registrada'}</dd></div>
              <div><dt className="text-xs font-bold uppercase tracking-wide text-outline">Especialidad</dt><dd className="mt-1 text-sm font-medium text-on-surface">{profile.especialidad || 'No registrada'}</dd></div>
              <div><dt className="text-xs font-bold uppercase tracking-wide text-outline">ORCID</dt><dd className="mt-1 text-sm font-medium text-on-surface">{profile.orcid || 'No proporcionado'}</dd></div>
              <div className="sm:col-span-2"><dt className="text-xs font-bold uppercase tracking-wide text-outline">Biografía académica</dt><dd className="mt-2 min-h-16 whitespace-pre-wrap rounded-lg bg-surface-container-low px-4 py-3 text-sm leading-6 text-on-surface">{profile.biografia || 'No registrada'}</dd></div>
            </dl>
          </section>
        )}

        <div className="mb-6 rounded-xl border border-outline-variant/20 bg-surface-container-low p-4">
          {!investigator && (
            <>
              <h3 className="text-sm font-bold text-primary">Directorio de investigadores</h3>
              <p className="mt-1 text-sm text-on-surface-variant">
                Guardar tu perfil académico no te incorpora automáticamente al directorio. Puedes solicitar la inclusión cuando completes tu grado, institución, especialidad y biografía.
              </p>
              {!hasProfile && <p className="mt-2 text-xs text-amber-800">Guarda primero el perfil para habilitar la solicitud.</p>}
              {profileDirty && <p className="mt-2 text-xs font-semibold text-amber-800">Guarda los cambios del perfil antes de enviar la solicitud.</p>}
              {hasProfile && !completeForDirectory && !profileDirty && <p className="mt-2 text-xs text-amber-800">Completa los cuatro campos indicados para habilitar la solicitud.</p>}
              {!editingProfile && <button
                type="button"
                onClick={requestDirectory}
                disabled={!hasProfile || !completeForDirectory || profileDirty || requesting || saving}
                className="mt-3 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-on-primary transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-lg">send</span>
                {requesting ? 'Enviando solicitud…' : 'Solicitar inclusión en el directorio'}
              </button>}
            </>
          )}
          {investigator?.estado === 'pendiente' && (
            <><h3 className="text-sm font-bold text-amber-900">Solicitud pendiente de revisión</h3><p className="mt-1 text-sm text-amber-800">El administrador académico revisará tu perfil y asignará las áreas temáticas correspondientes.</p></>
          )}
          {investigator?.estado === 'observado' && (
            <>
              <h3 className="text-sm font-bold text-amber-900">Tu solicitud requiere correcciones</h3>
              <p className="mt-1 text-sm text-amber-800">{investigator.observacion_revision || 'Actualiza tu perfil según las observaciones y vuelve a enviarlo.'}</p>
              <p className="mt-1 text-xs text-amber-800">Guarda primero cualquier cambio del perfil antes de reenviarlo.</p>
              {!editingProfile && <button type="button" onClick={() => { setEditingProfile(true); setNotice(''); }} className="mt-3 mr-2 inline-flex items-center gap-2 rounded-lg border border-amber-300 bg-white px-4 py-2.5 text-sm font-bold text-amber-950 hover:bg-amber-50"><span className="material-symbols-outlined text-lg">edit</span>Editar correcciones</button>}
              {!editingProfile && <button type="button" onClick={requestDirectory} disabled={!completeForDirectory || profileDirty || requesting || saving} className="mt-3 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-on-primary disabled:cursor-not-allowed disabled:opacity-50">
                <span className="material-symbols-outlined text-lg">send</span>{requesting ? 'Enviando correcciones…' : 'Enviar correcciones a revisión'}
              </button>}
            </>
          )}
          {investigator?.estado === 'activo' && (
            <><h3 className="text-sm font-bold text-emerald-900">Investigador activo</h3><p className="mt-1 text-sm text-emerald-800">{investigator.visible_directorio ? 'Tu perfil está visible en el directorio público.' : 'Tu registro está activo; el administrador aún no lo ha publicado en el directorio.'}</p></>
          )}
          {(investigator?.estado === 'rechazado' || investigator?.estado === 'inactivo') && (
            <>
              <h3 className="text-sm font-bold text-on-surface">{investigator.estado === 'rechazado' ? 'Solicitud no aprobada' : 'Registro inactivo'}</h3>
              <p className="mt-1 text-sm text-on-surface-variant">
                {investigator.observacion_revision || 'El administrador actualizó el estado de tu registro.'}
              </p>
              <p className="mt-1 text-sm text-on-surface-variant">Puedes solicitar una nueva revisión después de actualizar tu perfil.</p>
              {profileDirty && <p className="mt-2 text-xs font-semibold text-amber-800">Guarda los cambios del perfil antes de enviar la solicitud.</p>}
              {!editingProfile && <button type="button" onClick={() => { setEditingProfile(true); setNotice(''); }} className="mt-3 mr-2 inline-flex items-center gap-2 rounded-lg border border-outline-variant/40 bg-white px-4 py-2.5 text-sm font-bold text-primary hover:bg-surface-container-low"><span className="material-symbols-outlined text-lg">edit</span>Editar perfil</button>}
              {!editingProfile && <button type="button" onClick={requestDirectory} disabled={!completeForDirectory || profileDirty || requesting || saving} className="mt-3 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-on-primary disabled:cursor-not-allowed disabled:opacity-50">
                <span className="material-symbols-outlined text-lg">refresh</span>{requesting ? 'Enviando solicitud…' : 'Solicitar nueva revisión'}
              </button>}
            </>
          )}
        </div>

        {(!hasProfile || editingProfile) && <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {FIELDS.map(({ name, label, placeholder }) => (
              <label key={name} className="block space-y-1.5">
                <span className="text-sm font-semibold text-on-surface">{label}</span>
                <input
                  name={name}
                  value={profile[name] || ''}
                  onChange={handleChange}
                  placeholder={placeholder}
                  maxLength={name === 'grado_academico' ? 100 : name === 'institucion' ? 200 : name === 'especialidad' ? 200 : 30}
                  autoCapitalize={name === 'orcid' ? 'characters' : undefined}
                  className="w-full rounded-lg border border-outline-variant/50 bg-background px-3.5 py-2.5 text-sm text-on-surface outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
                />
                {name === 'orcid' && <span className="block text-xs text-outline">Ingresa 16 dígitos juntos o con guiones. También puedes pegar tu enlace ORCID.</span>}
              </label>
            ))}
          </div>

          <label className="block space-y-1.5">
            <span className="text-sm font-semibold text-on-surface">Biografía académica</span>
            <textarea
              name="biografia"
              value={profile.biografia || ''}
              onChange={handleChange}
              rows={6}
              placeholder="Describe tu trayectoria, líneas de trabajo e intereses académicos."
              className="w-full resize-y rounded-lg border border-outline-variant/50 bg-background px-3.5 py-2.5 text-sm text-on-surface outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
            />
          </label>

          <div className="flex justify-end gap-2 border-t border-outline-variant/20 pt-5">
            {hasProfile && <button type="button" onClick={cancelEditing} disabled={saving} className="rounded-lg px-4 py-2.5 text-sm font-semibold text-on-surface-variant hover:bg-surface-container">Cancelar</button>}
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-bold text-on-primary transition hover:opacity-90 disabled:cursor-wait disabled:opacity-60"
            >
              <span className="material-symbols-outlined text-lg">save</span>
              {saving ? 'Guardando…' : hasProfile ? 'Guardar cambios' : 'Guardar perfil'}
            </button>
          </div>
        </form>}
      </div>
    </section>
  );
}
