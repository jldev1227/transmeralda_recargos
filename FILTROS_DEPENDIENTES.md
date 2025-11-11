# 🎯 Sistema de Filtros Dependientes - Planilla de Recargos

## 📋 Descripción General

Se ha implementado un sistema avanzado de filtros dependientes que permite una experiencia de usuario más intuitiva y eficiente. Cuando seleccionas un filtro, automáticamente se actualizan las opciones disponibles en los demás filtros.

## 🔄 Cómo Funcionan los Filtros Dependientes

### ✅ Funcionalidad Principal

Los filtros ahora son **inteligentes** y se adaptan dinámicamente:

1. **Seleccionar Empresa** → Solo muestra conductores, placas y planillas de esa empresa
2. **Seleccionar Conductor** → Solo muestra placas y planillas asociadas a ese conductor
3. **Seleccionar Placa** → Solo muestra conductores y planillas de esa placa
4. **Seleccionar Planilla** → Solo muestra conductores y placas de esa planilla
5. **Seleccionar Estado** → Afecta todos los demás filtros

### 🎨 Mejoras Visuales

- **Contador de opciones**: Cada dropdown muestra cuántas opciones están disponibles
- **Indicador de filtros activos**: El header muestra cuando hay filtros afectando las opciones
- **Toggle mejorado**: Los botones de filtro funcionan como toggle con indicadores visuales

## 🛠️ Implementación Técnica

### Función Principal: `getFilteredUniqueValues`

```typescript
const getFilteredUniqueValues = useCallback(
  (field: string, excludeCurrentFilter = true) => {
    // Excluye el filtro actual para evitar dependencias circulares
    const activeFilters = excludeCurrentFilter
      ? { ...filters, [field]: [] }
      : filters;

    // Filtra los datos basándose en filtros activos
    let filteredData = [...processedDataWithTotals];

    // Aplica cada filtro de forma secuencial
    // Cada filtro reduce el conjunto de datos disponibles

    return Array.from(values).sort();
  },
  [processedDataWithTotals, filters],
);
```

### Características Clave

1. **Evita Dependencias Circulares**: Un filtro no depende de sí mismo
2. **Filtrado Secuencial**: Cada filtro reduce las opciones disponibles
3. **Actualización en Tiempo Real**: Los cambios se reflejan inmediatamente
4. **Optimización de Performance**: Uso de `useCallback` para memorización

## 🎯 Ejemplos de Uso

### Escenario 1: Filtrar por Empresa

1. Usuario selecciona "Empresa ABC"
2. El filtro de conductores solo muestra conductores de "Empresa ABC"
3. El filtro de placas solo muestra placas asignadas a "Empresa ABC"
4. El filtro de planillas solo muestra planillas de "Empresa ABC"

### Escenario 2: Combinación de Filtros

1. Usuario selecciona "Empresa ABC" + "Conductor Juan Pérez"
2. El filtro de placas solo muestra placas que ha manejado Juan Pérez en Empresa ABC
3. El filtro de planillas solo muestra planillas donde aparece Juan Pérez en Empresa ABC

### Escenario 3: Filtrado por Placa

1. Usuario selecciona "Placa XYZ-123"
2. El filtro de conductores solo muestra quiénes han manejado esa placa
3. El filtro de planillas solo muestra planillas donde aparece esa placa

## 🎨 Indicadores Visuales

### En el Header

- **Descripción**: "Vista de recargos con filtros dependientes - Los filtros se adaptan automáticamente"
- **Indicador Activo**: "✨ Filtros activos afectando opciones disponibles" (cuando hay filtros aplicados)

### En cada Dropdown

- **Contador de Opciones**: Muestra cuántas opciones están disponibles después del filtrado
- **Ejemplo**: "5 opciones" en lugar de mostrar todas las opciones originales

### En los Botones de Filtro

- **Estado Cerrado**: Fondo gris claro, tooltip "Abrir filtro"
- **Estado Abierto**: Fondo verde, tooltip "Cerrar filtro"

## 🔧 Configuración y Mantenimiento

### Agregar Nuevos Filtros Dependientes

Para agregar un nuevo tipo de filtro:

1. **Actualizar `getFilteredUniqueValues`**:

   ```typescript
   // Agregar lógica de filtrado
   if (activeFilters.nuevoFiltro && activeFilters.nuevoFiltro.length > 0) {
     filteredData = filteredData.filter((item) =>
       activeFilters.nuevoFiltro.includes(item.campo?.valor || "")
     );
   }

   // Agregar case en switch
   case "nuevoFiltro":
     value = item.campo?.valor || "Sin valor";
     break;
   ```

2. **Actualizar el mapeo de columnas**:
   ```typescript
   const keyMap: Record<string, keyof typeof showFilters> = {
     // ... otros mapeos
     nuevo_campo: "nuevoFiltro",
   };
   ```

### Debugging y Troubleshooting

Si los filtros no funcionan correctamente:

1. **Verificar datos**: Asegurar que `processedDataWithTotals` tiene la estructura correcta
2. **Verificar mapeo**: Confirmar que el `keyMap` incluye todos los campos necesarios
3. **Verificar filtros**: Confirmar que el estado `filters` se actualiza correctamente

## 📈 Beneficios

1. **Mejor UX**: Los usuarios ven solo opciones relevantes
2. **Menor Carga Cognitiva**: Menos opciones irrelevantes que procesar
3. **Filtrado Más Rápido**: Encuentras lo que buscas más rápido
4. **Datos Más Consistentes**: Las combinaciones de filtros siempre tienen sentido

## 🎉 Resultado Final

Los usuarios ahora pueden:

- ✅ Filtrar datos de forma más intuitiva
- ✅ Ver solo opciones relevantes en cada dropdown
- ✅ Entender visualmente qué filtros están activos
- ✅ Navegar más eficientemente por grandes volúmenes de datos
- ✅ Combinar filtros de forma lógica y coherente

¡El sistema de filtros dependientes transforma la experiencia de usuario de básica a avanzada! 🚀
