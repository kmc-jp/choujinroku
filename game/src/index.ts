import "bulma/css/bulma.min.css";
import Vue from "vue";
import App from "./components/app.vue";
new Vue({
  el: "#app",
  template: `<div><app/></div>`,
  components: { App }
});
