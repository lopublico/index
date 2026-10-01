# Formulario de contacto

La web es estática, así que este worker de Cloudflare recibe el formulario de contacto y lo reenvía por correo con Resend.

## Puesta en marcha

1. Cuenta gratuita en Resend (con el correo de destino) y una API key con permiso de envío.
2. Desplegar:
   ```
   cd workers/contacto
   npx wrangler deploy
   npx wrangler secret put RESEND_API_KEY
   npx wrangler secret put TURNSTILE_SECRET
   ```
3. Con el dominio sin verificar en Resend, el remitente solo puede ser `onboarding@resend.dev` y el destino solo el correo de la cuenta de Resend. Para enviar desde `contacto@lopublico.es`, verifica el dominio en Resend (registros DNS en GoDaddy) y cambia `MAIL_FROM`.
4. Variables de la web al construirla:
   ```
   PUBLIC_CONTACT_ENDPOINT=https://lopublico-contacto.report-erratum.workers.dev
   PUBLIC_TURNSTILE_SITEKEY=<clave pública del widget lopublico-contacto>
   ```

El worker descarta el envío si el campo trampa (`website`) viene relleno, valida y limita tamaños, comprueba Turnstile y solo acepta peticiones de los dominios configurados. El correo del visitante va en `Reply-To`.
