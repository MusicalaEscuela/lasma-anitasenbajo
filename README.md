# Las mañanitas en bajo | Musicala 🎸

Aplicación web interactiva para estudiantes principiantes de bajo eléctrico, creada con HTML, CSS y JavaScript sin librerías ni dependencias externas.

## Abrir y usar

1. Descomprime todo el ZIP en una carpeta.
2. Abre **`index.html`** en Chrome, Edge, Firefox o Safari.
3. Presiona **«Escuchar melodía»** para oírla, o pulsa las posiciones del diapasón.
4. Usa **«Aprender»** para escuchar notas libremente y **«Reto»** para comprobar la cuerda y el traste correcto.

**No se necesita internet para abrir `index.html` después de descomprimir.** El sonido se genera en el navegador mediante Web Audio, por lo que debe activarse con un clic o un toque.

## Contenido musical

- Melodía: «Las mañanitas» (tradicional de México), adaptación didáctica de la estrofa principal.
- Instrumento: bajo eléctrico de cuatro cuerdas, afinación estándar E1–A1–D2–G2 (MI–LA–RE–SOL).
- Tonalidad: **Do mayor**, transportada para tocar la línea melódica en primera posición.
- Trastes utilizados: **0, 2 y 3**. La nota G1 se toca en MI traste 3 y la nota G2 en SOL al aire.
- Compás: **3/4**, con valores rítmicos simplificados para estudiantes iniciales.
- Notación numérica: el primer dígito indica la cuerda y el segundo indica el traste. **43** = cuerda 4, traste 3. **10** = cuerda 1 al aire. El comienzo es **43 43 | 33 33 32 33**, con la barra como separación de compases. El selector permite cambiar entre notación numérica (vista inicial), tablatura y partitura en clave de fa.
- Digitación sugerida: dedo 2 (medio) en traste 2, dedo 3 (anular) en traste 3. Puede ajustarse según la técnica indicada por el docente.
- Variantes tradicionales de esta canción tienen pequeñas diferencias melódicas o rítmicas. Esta es una versión escolar simplificada.

Para cotejar la línea melódica se tomó como referencia una versión pública en Sol mayor de la canción tradicional: https://vivace-music.org/sheets/las-mananitas-mexican-folk-song-easy-piano.html (melodía acreditada como tradicional/dominio público). **No** se incluye su PDF ni sus archivos de audio; la digitación, el sonido y la interfaz de esta app son propios.

## Funciones

- Diapasón interactivo 4 cuerdas x trastes 0–3.
- Resaltado de la nota y su ubicación en la tablatura.
- Escucha de la melodía y de notas individuales.
- Velocidad ajustable entre 45 y 130 BPM, metrónomo opcional y repetición.
- Práctica por cuatro fragmentos o canción completa.
- Reto con avance automático al acertar una nota.
- Canción completa en el formato seleccionado con el botón «Imprimir lectura actual».
- Funciona en móviles y computadoras.
- Instalación como app (PWA) cuando se publica en HTTPS; caché para uso posterior sin conexión.
- Accesos de teclado: **espacio** reproducir/pausar, **← / →** cambiar de nota, **Enter** escuchar nota.

## Publicación en línea

Todo lo que se necesita para publicarla está en esta carpeta. Puedes subirla a Firebase Hosting, GitHub Pages o cualquier servidor web estático. Si se abre desde `file://`, reproduce la música igualmente, aunque la función de instalación de la PWA solo está disponible al servirla por HTTPS o localhost.

## Archivos

- `index.html`: estructura y accesibilidad.
- `styles.css`: diseño adaptativo e impresión.
- `app.js`: melodía, digitación, audio y práctica.
- `manifest.webmanifest`: configuración instalable.
- `sw.js`: funcionamiento offline cuando está alojada en HTTPS.
- `icons/`: iconos.

**Musicala** · Adaptación educativa para bajo · 2026
