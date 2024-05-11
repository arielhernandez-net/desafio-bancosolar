const setInfoModal = (nombre, balance, id) => {
  $("#nombreEdit").val(nombre);
  $("#balanceEdit").val(balance);
  $("#editButton").attr("onclick", `editUsuario('${id}')`);
};

const editUsuario = async (id) => {
  const nombre = $("#nombreEdit").val();
  const balance = Number($("#balanceEdit").val());
  try {
    const { data } = await axios.put(
      `http://localhost:3000/usuario`,
      {
        id,
        nombre,
        balance,
      }
    );
    $("#exampleModal").modal("hide");
    location.reload();
  } catch (e) {
    alert("Algo salió mal..." + e);
  }
};

$("form:first").submit(async (e) => {
  e.preventDefault();
  let nombre = $("form:first input:first").val();
  let balance = Number($("form:first input:nth-child(2)").val());
  try {
    const response = await fetch("http://localhost:3000/usuario", {
      method: "post",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        nombre,
        balance,
      }),
    });
    $("form:first input:first").val("");
    $("form:first input:nth-child(2)").val("");
    location.reload();
  } catch (e) {
    alert("Algo salió mal ..." + e);
  }
});


$("form:last").submit(async (e) => {
  e.preventDefault();
  let emisor = $("form:last select:first").val();
  let receptor = $("form:last select:last").val();
  let monto = $("#monto").val();
  if (!monto || !emisor || !receptor) {
    alert("Debe seleccionar un emisor, receptor y monto a transferir");
    return false;
  }
  try {
    const response = await fetch("http://localhost:3000/transferencia", {
      method: "post",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        emisor,
        receptor,
        monto,
      }),
    });
    const data = await response.json();
    location.reload();
  } catch (e) {
    console.log(e);
    alert("Algo salió mal..." + e);
  }
});

const getUsuarios = async () => {
  const response = await fetch("http://localhost:3000/usuarios");
  let data = await response.json();
  $(".usuarios").html("");

  $.each(data, (i, c) => {
    $(".usuarios").append(`
              <tr>
                <td>${c.nombre}</td>
                <td>${c.balance}</td>
                <td>
                  <button
                    class="btn btn-warning mr-2"
                    data-toggle="modal"
                    data-target="#exampleModal"
                    onclick="setInfoModal('${c.nombre}', '${c.balance}', '${c.id}')"
                  >
                    Editar</button
                  ><button class="btn btn-danger" onclick="eliminarUsuario('${c.id}')">Eliminar</button>
                </td>
              </tr>
         `);

    $("#emisor").append(`<option value="${c.nombre}">${c.nombre}</option>`);
    $("#receptor").append(`<option value="${c.nombre}">${c.nombre}</option>`);
  });
};

const eliminarUsuario = async (id) => {
  try {
    const response = await fetch(`http://localhost:3000/usuario/${id}`, {
      method: "DELETE",
    });
    if (response.ok) {
      alert("Usuario eliminado correctamente");
      getUsuarios();
    } else {
      console.error("Error al eliminar usuario");
    }
  } catch (error) {
    console.error("Error al eliminar usuario:", error);
  }
};

const getTransferencias = async () => {

  try {
    const responseTransferencias = await axios.get("http://localhost:3000/transferencias");
    const dataTransferencias = responseTransferencias.data;

    const responseUsuarios = await fetch("http://localhost:3000/usuarios");
    const dataUsuarios = await responseUsuarios.json();

    const usuariosMap = {};
    dataUsuarios.forEach(usuario => {
      usuariosMap[usuario.id] = usuario.nombre;
    });

    $(".transferencias").html("");

    dataTransferencias.forEach(transferencia => {
      const emisor = usuariosMap[transferencia.emisor] || "Usuario desconocido";
      const receptor = usuariosMap[transferencia.receptor] || "Usuario desconocido";

      $(".transferencias").append(`
              <tr>
                  <td>${formatDate(transferencia.fecha)}</td>
                  <td>${emisor}</td>
                  <td>${receptor}</td>
                  <td>${transferencia.monto}</td>
              </tr>
          `);
    });
  } catch (error) {
    console.error("Error al obtener las transferencias:", error);
    alert("Error al obtener las transferencias");
  }
};

getUsuarios();
getTransferencias();

const formatDate = (date) => {
  const dateFormat = moment(date).format("L");
  const timeFormat = moment(date).format("LTS");
  return `${dateFormat} ${timeFormat}`;
};
formatDate();
