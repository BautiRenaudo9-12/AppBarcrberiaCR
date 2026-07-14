import { createRoot } from "react-dom/client";
import moment from "moment";
import App from "./App";
import { validateEnv } from "@/lib/env";

// Registramos el locale español directamente sobre esta instancia de moment en vez
// de `import "moment/locale/es"`: bajo el optimizador de deps de Vite (esbuild), ese
// import de side-effect se bundlea con una copia SEPARADA de moment y el locale queda
// registrado en otra instancia → fechas en inglés solo en dev. `updateLocale` corre
// sobre el mismo moment que importan los componentes, así que funciona en dev y prod.
// Config tomada del locale oficial `moment/locale/es`.
moment.updateLocale("es", {
  months: "enero_febrero_marzo_abril_mayo_junio_julio_agosto_septiembre_octubre_noviembre_diciembre".split("_"),
  monthsShort: "ene._feb._mar._abr._may._jun._jul._ago._sep._oct._nov._dic.".split("_"),
  weekdays: "domingo_lunes_martes_miércoles_jueves_viernes_sábado".split("_"),
  weekdaysShort: "dom._lun._mar._mié._jue._vie._sáb.".split("_"),
  weekdaysMin: "do_lu_ma_mi_ju_vi_sá".split("_"),
  weekdaysParseExact: true,
  longDateFormat: {
    LT: "H:mm",
    LTS: "H:mm:ss",
    L: "DD/MM/YYYY",
    LL: "D [de] MMMM [de] YYYY",
    LLL: "D [de] MMMM [de] YYYY H:mm",
    LLLL: "dddd, D [de] MMMM [de] YYYY H:mm",
  },
  calendar: {
    sameDay: "[hoy a las] LT",
    nextDay: "[mañana a las] LT",
    nextWeek: "dddd [a las] LT",
    lastDay: "[ayer a las] LT",
    lastWeek: "[el] dddd [pasado a las] LT",
    sameElse: "L",
  },
  relativeTime: {
    future: "en %s",
    past: "hace %s",
    s: "unos segundos",
    ss: "%d segundos",
    m: "un minuto",
    mm: "%d minutos",
    h: "una hora",
    hh: "%d horas",
    d: "un día",
    dd: "%d días",
    M: "un mes",
    MM: "%d meses",
    y: "un año",
    yy: "%d años",
  },
  ordinal: "%dº",
  week: {
    dow: 1, // lunes es el primer día de la semana
    doy: 4,
  },
  invalidDate: "Fecha inválida",
});
moment.locale("es");

validateEnv();

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Root element not found");
}

createRoot(rootElement).render(<App />);
