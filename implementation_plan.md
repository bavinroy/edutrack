# EduTrack Deployment Plan

This plan outlines the steps required to transition the EduTrack application from a local development environment to a production-ready state.

## Proposed Changes

### Backend (`edutrack`)
#### Infrastructure
- **Hosting**: Render (Web Service for Django, Managed PostgreSQL for database).
- **Environment**: Use environment variables for `SECRET_KEY`, `DEBUG`, and `DATABASE_URL`.

#### [MODIFY] [settings.py](file:///c:/Users/HP/Desktop/tail/edutrack/edutrack/settings.py)
- Set `DEBUG = os.getenv('DEBUG', 'False') == 'True'`.
- Restrict `ALLOWED_HOSTS` to the Render domain (e.g., `['edutrack-api.onrender.com']`).
- Use `python-decouple` to manage sensitive keys.

#### [MODIFY] [requirements.txt](file:///c:/Users/HP/Desktop/tail/edutrack/requirements.txt)
- Add `gunicorn` for production serving.
- Add `python-decouple` for environment variable management.
- Add `whitenoise` (ensure it's pinned).
- Add `dj-database-url` (ensure it's pinned).

#### [NEW] [Procfile](file:///c:/Users/HP/Desktop/tail/edutrack/Procfile)
- Content: `web: gunicorn edutrack.wsgi --log-file -`

#### [NEW] [runtime.txt](file:///c:/Users/HP/Desktop/tail/edutrack/runtime.txt)
- Content: `python-3.11.0` (Verify version with `python --version`).

### Frontend ([student](file:///c:/Users/HP/Desktop/tail/edutrack/accounts/models.py#183-185))
#### [MODIFY] [config.ts](file:///c:/Users/HP/Desktop/tail/student/app/config.ts)
- Update `API_BASE_URL` to your Render API URL.

#### Infrastructure
- **Hosting**: Expo EAS for Native apps, Render/Vercel for Web build.
- **Build Tool**: `eas-cli` for native deployments.

---

## Verification Plan

### Automated Tests
- Run PostgreSQL connectivity check locally using a production-like environment variable.
- Execute `python manage.py check --deploy` to identify production security risks.

### Manual Verification
- **Build Test**: Run `npx expo export` to ensure the frontend builds without errors.
- **Backend Health Check**: Deploy to a staging environment on Render and verify the `/api/accounts/whoami/` endpoint returns a 401 (Unauthorized) instead of a 500 error.
- **Admin Access**: Verify that the Django admin is accessible and correctly styled via WhiteNoise.
