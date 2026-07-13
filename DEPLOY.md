# Guía de Despliegue en Vercel 🚀

Este archivo contiene los comandos rápidos para subir tus cambios a **Vercel**.

---

## ⚡ Cargar Cambios Directamente a Vercel (Sin usar GitHub)

Si no quieres usar GitHub y prefieres subir tus cambios directamente desde la terminal de tu computadora:

1. Guarda todos tus archivos en VS Code.
2. Abre la terminal y ejecuta:
   ```bash
   vercel --prod
   ```

*Este comando subirá tu código local, compilará tu aplicación en la nube y actualizará tu web oficial (**https://dexcovhud.vercel.app**) inmediatamente.*

> 💡 **Nota:** Si solo ejecutas `vercel` (sin el `--prod`), se subirá a un enlace temporal de pruebas (Preview) para que lo revises antes de que sea público en el enlace definitivo.

---

## 🔄 Alternativa: Despliegue Automático con GitHub

Como vinculaste tu repositorio de GitHub, también puedes subir tus cambios haciendo un Push. Vercel se actualizará solo:

1. **Guardar y preparar tus cambios**:
   ```bash
   git add .
   ```
2. **Crear el commit**:
   ```bash
   git commit -m "Mis cambios nuevos"
   ```
3. **Subir a GitHub**:
   ```bash
   git push origin main
   ```

---

## 🛠️ Comandos de Configuración Útiles

* **Para desvincular este proyecto de Vercel (y poder vincularlo a otro nuevo)**:
  ```powershell
  Remove-Item -Recurse -Force .vercel
  ```
* **Para añadir una variable de entorno**:
  ```bash
  vercel env add NOMBRE_DE_VARIABLE
  ```
