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
import config from "config";
const { dbConfig: dataBaseConfig } = config.get("dbConfig");
import mysql from "mysql2/promise";

const api_token = "token";
const id = "45";
const store_name = "Название магазина";

const testingDB = async (api_token, store_name, id) => {
  const sql3 = `UPDATE stores SET ? WHERE id = ${id}`;
  const sql1 = `UPDATE users SET ?`;
  const conn = await mysql.createConnection(dataBaseConfig);
  //   console.log(await conn.query(sql3, { store_name, api_token }));
  console.log(
    await conn.query(sql1, {
      adate: (Date.now() + 180 * 24 * 60 * 60 * 1000).toString(),
    })
  );
  conn.end();
};
testingDB(api_token, store_name, id);
