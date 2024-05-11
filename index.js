const express = require('express');
const client = require('./db');
const app = express();
const port = 3000;
app.use(express.json());
app.use(express.static('public'));

app.post('/usuario', async (req, res) => {
    const { nombre, balance } = req.body;

    try {
        await client.query('INSERT INTO usuarios (nombre, balance) VALUES ($1, $2)', [nombre, balance]);
        res.status(201).send('Usuario creado exitosamente');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error al crear usuario');
    }
});

app.get('/usuarios', async (req, res) => {
    try {
        const results = await client.query('SELECT * FROM usuarios');
        res.status(200).json(results.rows);
    } catch (error) {
        console.error(error);
        res.status(500).send('Error al obtener usuarios');
    }
});

app.put('/usuario', async (req, res) => {

    const { id, nombre, balance } = req.body;

    try {
        if (!id || !nombre || isNaN(balance)) {
            throw new Error('Datos de actualización incompletos o inválidos');
        }

        const updateQuery = 'UPDATE usuarios SET nombre = $1, balance = $2 WHERE id = $3';
        const updateValues = [nombre, parseFloat(balance), id];
        const result = await client.query(updateQuery, updateValues);

        if (result.rowCount === 1) {
            res.status(200).send('Usuario actualizado exitosamente');
        } else {
            throw new Error('El usuario no fue encontrado o no se pudo actualizar');
        }
    } catch (error) {
        res.status(500).send(error.message || 'Error al actualizar el usuario');
    }
});

app.delete('/usuario/:id', async (req, res) => {
    const id = parseInt(req.params.id);

    try {
        await client.query('DELETE FROM usuarios WHERE id = $1', [id]);
        res.status(200).send('Usuario eliminado exitosamente');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error al eliminar usuario');
    }
});

app.post("/transferencia", async (req, res) => {
    try {
        const { emisor, receptor, monto } = req.body;

        if (!emisor || !receptor || isNaN(monto) || monto <= 0) {
            throw new Error('Los datos de entrada son inválidos');
        }

        await client.query("BEGIN");

        const emisorData = await getUserData(emisor);
        const receptorData = await getUserData(receptor);
        const emisorId = emisorData.id;
        const receptorId = receptorData.id;
        const saldoEmisor = parseFloat(emisorData.balance);
        const saldoReceptor = parseFloat(receptorData.balance);

        if (saldoEmisor < monto) {
            throw new Error('Saldo insuficiente para realizar la transferencia');
        }
        const nuevoSaldoEmisor = saldoEmisor - parseFloat(monto);
        const nuevoSaldoReceptor = saldoReceptor + parseFloat(monto);

        await updateBalance(emisorId, nuevoSaldoEmisor);
        await updateBalance(receptorId, nuevoSaldoReceptor);

        const fecha = new Date();
        const transferenciaResult = await registrarTransferencia(emisorId, receptorId, parseFloat(monto), fecha);

        await client.query("COMMIT");

        res.status(200).send(transferenciaResult.rows[0]);
    } catch (error) {
        await client.query("ROLLBACK");
        res.status(500).send(error.message || "Error 500");
    }
});


app.get('/transferencias', async (req, res) => {
    try {
        const results = await client.query('SELECT * FROM transferencias');
        res.status(200).json(results.rows);
    } catch (error) {
        console.error(error);
        res.status(500).send('Error al obtener transferencias');
    }
});

async function getUserData(nombre) {
    const userData = await client.query('SELECT id, balance FROM usuarios WHERE nombre = $1', [nombre]);
    if (userData.rows.length === 0) {
        throw new Error(`El usuario "${nombre}" no existe en la base de datos`);
    }
    return userData.rows[0];
}

async function updateBalance(userId, newBalance) {
    await client.query('UPDATE usuarios SET balance = $1 WHERE id = $2', [newBalance, userId]);
}

async function registrarTransferencia(emisorId, receptorId, monto, fecha) {
    return await client.query('INSERT INTO transferencias(emisor, receptor, monto, fecha) VALUES($1, $2, $3, $4) RETURNING *', [emisorId, receptorId, monto, fecha]);
}

app.listen(port, () => {
    console.log(`Servidor escuchando en el puerto ${port}`);
  });
