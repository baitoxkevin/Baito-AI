# Security Policy

## 🔒 Security Best Practices

### Environment Variables
**CRITICAL**: Never commit `.env` files or API keys to version control.

#### What NOT to commit:
- `.env` files
- API keys (OpenRouter, Supabase, etc.)
- Service role keys
- Access tokens
- Database credentials

#### Best Practices:
1. Always use `.env.example` as a template (without real credentials)
2. Add `.env` to `.gitignore` (already configured)
3. Store production secrets in Netlify environment variables
4. Rotate keys immediately if accidentally exposed

### If You Accidentally Expose an API Key

1. **Immediately rotate the key** at the service provider:
   - OpenRouter: https://openrouter.ai/keys
   - Supabase: Project Settings → API
   
2. **Remove from Git history**:
   ```bash
   git rm --cached .env
   git commit -m "security: remove exposed credentials"
   git push origin main
   ```

3. **Update all applications** using the old key

### Deployment Security

#### Netlify Environment Variables
Set these in: Site settings → Environment variables

Required variables:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_OPENROUTER_API_KEY`

Never hardcode these in your application code!

### Reporting Security Issues

If you discover a security vulnerability, please email: [your-security-email]

Do NOT create public GitHub issues for security vulnerabilities.

## 🛡️ Security Features

- Row Level Security (RLS) enabled on all Supabase tables
- API keys are environment-specific
- Client-side authentication with JWT
- HTTPS-only in production
- Content Security Policy (CSP) headers configured

## 📋 Security Checklist

Before deploying:
- [ ] All `.env` files are gitignored
- [ ] No hardcoded API keys in source code
- [ ] Environment variables set in Netlify
- [ ] Supabase RLS policies are enabled
- [ ] HTTPS is enforced
- [ ] CSP headers are configured

---

**Last Updated**: 2025-10-06
