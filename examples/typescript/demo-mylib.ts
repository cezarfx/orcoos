import App from "../../mylib-index";

async function f() {
   console.log("Hello " + await App.add(2, 3));
}

f();