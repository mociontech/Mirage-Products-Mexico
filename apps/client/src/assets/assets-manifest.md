# Assets manifest

Mapa de cada asset a su nodo de origen en Figma (`vilVPSsVUtGwTG8Er9njo5`, archivo "Mirage").

| Archivo | Nodo Figma | Notas |
| --- | --- | --- |
| `images/mirage-logo.svg` | `23:472` ("Logo Mirage 1", pagina UI-Kit) | Optimizado con SVGO, se le quito `preserveAspectRatio="none"` que dejaba el export listo para deformarse. |
| `images/wave-decoration.webp` | `29:240` ("01_Inicio", fill de `onda2 2`) | Textura decorativa de fondo repetida en Inicio/Registro/Agradecimiento. Convertida a WebP. |
| `images/product-select-board-reference.webp` | `1:356` ("03_Pantalla_seleccion_productos") | **Placeholder**: foto de referencia del muro fisico con la disposicion de 12 productos, tomada del propio archivo de Figma (incluye el texto "Simulacion tablero tableta / 12 Piezas - 12 botones touch" horneado en la imagen). No es arte final - pendiente de que el equipo de marca entregue el catalogo real. |
| `images/product-magnum-inverter-22.webp` | `60:42` ("Ejemplo Producto seleccionado (Pantalla)") | Unica foto de producto que existe en Figma. Se usa como placeholder para todo el catalogo de muestra en `content/products.ts` hasta tener fotos reales de cada equipo. |
| `images/feature-inverter-technology.webp` | `60:42` | Icono/grafico de la feature "Tecnologia Inverter". |
| `images/placeholder-product.webp` | (generado, no existe en Figma) | Placeholder neutro ("Imagen pendiente") para los 11 productos del catalogo de muestra que no tienen foto real todavia. |
| `video/idle-loop-placeholder.mp4` | (no existe en Figma) | **Placeholder generado**, no es video institucional real. Figma no contiene video; el pitch necesita un loop institucional real que el equipo de marca todavia no entrego (ver Fase 5/README). Sirve para probar `VideoLayer` (autoplay, loop, crossfade) mientras tanto. |

Colores y tipografia estan en `styles/tokens.css`, extraidos del nodo `23:277` (seccion UI-KIT) - ver ese archivo para el detalle.
