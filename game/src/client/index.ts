import "bulma/css/bulma.min.css";
import "bulma-switch/dist/css/bulma-switch.min.css";
import Vue from "vue";
import App from "./app.vue";
new Vue({
  el: "#app",
  template: `<div><app/></div>`,
  components: { App }
});
