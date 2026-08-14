import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import PageTitle from "@/components/PageTitle";

// Página pública (sin auth) — la exige App Store Connect como URL de política de
// privacidad y debe ser accesible por cualquiera, incluido el equipo de revisión de Apple.
// Se registra en App.tsx SIN guardas de ruta.
const CONTACT_EMAIL = "renaudobautista@gmail.com";
const LAST_UPDATED = "13 de agosto de 2026";

export default function Privacidad() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="sticky top-0 z-50 bg-background/90 backdrop-blur-md border-b border-white/10 px-4 py-4 sm:px-6">
        <div className="max-w-2xl mx-auto flex items-center gap-4">
          <Link
            to="/"
            className="w-10 h-10 hover:bg-secondary/30 rounded-lg flex items-center justify-center transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <PageTitle className="text-2xl font-bold">Política de Privacidad</PageTitle>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 sm:px-6 space-y-6 pb-16">
        <p className="text-xs text-muted-foreground font-medium">
          Última actualización: {LAST_UPDATED}
        </p>

        <section className="space-y-2">
          <p className="text-sm text-muted-foreground leading-relaxed">
            Esta política describe cómo la aplicación <strong className="text-foreground">Barbería CR</strong>{" "}
            (en adelante, “la App”) trata los datos personales de sus usuarios. El responsable del tratamiento
            es <strong className="text-foreground">Claudio Renaudo</strong>. Para cualquier consulta sobre tus
            datos podés escribir a{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-accent underline underline-offset-2">
              {CONTACT_EMAIL}
            </a>
            .
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold">Qué datos recopilamos</h2>
          <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground leading-relaxed">
            <li>
              <strong className="text-foreground">Datos de cuenta:</strong> nombre, correo electrónico y foto de
              perfil, obtenidos cuando iniciás sesión con tu cuenta de Google.
            </li>
            <li>
              <strong className="text-foreground">Teléfono:</strong> el número que cargás en tu perfil, usado para
              contactarte por tu turno (por ejemplo, vía WhatsApp).
            </li>
            <li>
              <strong className="text-foreground">Reservas e historial:</strong> los turnos que reservás, cancelás
              o completás, y tu historial de visitas.
            </li>
            <li>
              <strong className="text-foreground">Notificaciones:</strong> si activás las notificaciones push,
              guardamos un identificador de tu dispositivo (token) para poder enviarte recordatorios y avisos.
            </li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold">Para qué usamos tus datos</h2>
          <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground leading-relaxed">
            <li>Gestionar tus reservas de turnos y mostrarte tu historial.</li>
            <li>Enviarte recordatorios de tu turno y avisos relevantes (si activaste las notificaciones).</li>
            <li>Contactarte en relación con tu turno.</li>
            <li>Operar, mantener y mejorar el funcionamiento de la App.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold">Con quién los compartimos</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            No vendemos tus datos personales. Los compartimos únicamente con los proveedores de tecnología que
            permiten que la App funcione, que los tratan por nuestra cuenta:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground leading-relaxed">
            <li>
              <strong className="text-foreground">Google Firebase</strong> (autenticación, base de datos y
              notificaciones push) y <strong className="text-foreground">Google</strong> (inicio de sesión).
            </li>
            <li>
              <strong className="text-foreground">Netlify</strong> (alojamiento del sitio y funciones del
              servidor).
            </li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold">Conservación de los datos</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Conservamos tus datos mientras mantengas tu cuenta activa. Si solicitás la baja, eliminamos tu perfil
            y tu historial asociado, salvo lo que debamos conservar por obligación legal.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold">Tus derechos</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Podés acceder, rectificar y solicitar la eliminación de tus datos. Podés desactivar las notificaciones
            en cualquier momento desde la propia App. Para eliminar tu cuenta o ejercer cualquiera de estos
            derechos, escribí a{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-accent underline underline-offset-2">
              {CONTACT_EMAIL}
            </a>
            .
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold">Seguridad</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Aplicamos medidas razonables para proteger tus datos frente a accesos no autorizados, pérdida o
            alteración. Ningún sistema es completamente infalible, pero trabajamos para resguardar tu información.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold">Marco legal</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            El tratamiento de datos se realiza conforme a la Ley N.º 25.326 de Protección de los Datos Personales
            de la República Argentina y la normativa de la Agencia de Acceso a la Información Pública (AAIP).
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold">Cambios en esta política</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Podemos actualizar esta política ocasionalmente. Publicaremos la versión vigente en esta misma página
            e indicaremos la fecha de la última actualización arriba.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold">Contacto</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Ante cualquier duda sobre esta política o sobre el tratamiento de tus datos, escribinos a{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-accent underline underline-offset-2">
              {CONTACT_EMAIL}
            </a>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
