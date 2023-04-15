import mysql from "mysql2/promise";

const dataBaseConfig = {
  host: "jackmarket.kz",
  port: "3306",
  user: "kaspiver0",
  password: "password",
  database: "verificator",
};
const dataBaseConfigProduction = {
  host: "127.0.0.1",
  port: "3306",
  user: "kaspiver0",
  password: "password",
  database: "verificator",
};

export default mysql.createPool(dataBaseConfigProduction);
