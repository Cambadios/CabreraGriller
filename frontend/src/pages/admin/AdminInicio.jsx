// src/pages/admin/AdminInicio.jsx

const CardResumen = ({ titulo, valor }) => (
  <div className="bg-white rounded-xl shadow p-4">
    <p className="text-xs md:text-sm text-slate-500">{titulo}</p>
    <p className="text-2xl md:text-3xl font-bold">{valor}</p>
  </div>
);

const AdminInicio = () => {
  return (
    <>
      <h2 className="text-xl md:text-2xl font-bold mb-2">Resumen general</h2>
      <p className="text-xs md:text-sm text-slate-600 mb-4">
        Aquí verás un resumen rápido de pedidos, ventas y platos.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-2">
        <CardResumen titulo="Pedidos de hoy" valor="0" />
        <CardResumen titulo="Ventas de hoy" valor="Bs. 0" />
        <CardResumen titulo="Platos activos" valor="0" />
      </div>
    </>
  );
};

export default AdminInicio;
