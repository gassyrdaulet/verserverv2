// const numbers = [0, 1, 2, 3, 4];

// function getRandomInt(max) {
//   return Math.floor(Math.random() * max);
// }

// const checkForUniqueId = async () => {
//   const store_id = getRandomInt(9);

//   if (numbers.includes(store_id)) {
//     return await checkForUniqueId();
//   } else {
//     return store_id;
//   }
// };

// const store_id = await checkForUniqueId();

// console.log(store_id);
// console.log(Date.now().toString());
// import config from "config";
// const { dbConfig: dataBaseConfig } = config.get("dbConfig");
// import mysql from "mysql2/promise";

// const testingDB = async () => {
//   const sql3 = `UPDATE users SET ? WHERE ?`;
//   const conn = await mysql.createConnection(dataBaseConfig);
//   await conn.query(sql3, { name: "Гасыренок" }, { id: 6 });
//   conn.end();
// };
// testingDB();
