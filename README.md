# 🛠️ OFI APP - Cachuelos en la Selva

Una aplicación web progresiva (PWA) mobile-first para conectar personas que buscan u ofrecen trabajos temporales en la selva peruana.

## 🚀 Características
- **Mobile-First**: Diseñada específicamente para ser rápida y simple en dispositivos móviles.
- **Sin Login Obligatorio**: Cualquiera puede ver y publicar anuncios rápidamente.
- **Contacto Directo por WhatsApp**: Sin mensajería interna, comunicación directa por el app preferida en la región.
- **PWA**: Instalable en la pantalla de inicio como una aplicación nativa.
- **Panel de Admin**: Herramientas integradas para moderar contenido.

## 🛠️ Stack Tecnológico
- **Frontend**: React + Vite + Tailwind CSS
- **Backend**: Firebase Firestore
- **PWA**: Vite PWA Plugin
- **Hosting sugerido**: Vercel / Netlify

## ⚙️ Configuración de Firebase

1. Ve a [Firebase Console](https://console.firebase.google.com/).
2. Crea un nuevo proyecto llamado "Ofi App".
3. Añade una **Web App** y copia las credenciales.
4. Habilita **Firestore Database** en modo producción o prueba (ajusta las reglas después).
5. Crea las siguientes colecciones:
   - `postings`: Donde se guardarán los anuncios.
   - `comentarios`: Donde se guardarán los comentarios de cada anuncio.
6. Configura las variables de entorno en un archivo `.env` en la raíz del proyecto:

```env
VITE_FIREBASE_API_KEY=tu_api_key
VITE_FIREBASE_AUTH_DOMAIN=tu_auth_domain
VITE_FIREBASE_PROJECT_ID=tu_project_id
VITE_FIREBASE_STORAGE_BUCKET=tu_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=tu_sender_id
VITE_FIREBASE_APP_ID=tu_app_id
```

## 📦 Instalación y Desarrollo

1. Clona el repositorio.
2. Instala las dependencias:
   ```bash
   npm install
   ```
3. Inicia el servidor de desarrollo:
   ```bash
   npm run dev
   ```

## 🚢 Despliegue

Puedes desplegarlo fácilmente en Vercel o Netlify conectando tu repositorio de GitHub. No olvides configurar las variables de entorno en el panel de control del hosting.

## 🔐 Admin
La contraseña predeterminada del panel de admin es `OFI2026`. Puedes cambiarla en `src/components/AdminPanel.jsx`.

---
*Hecho con ❤️ para la selva peruana.*
