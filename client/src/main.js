import { createApp } from 'vue';
import App from './App.vue';
import * as halleyxComponents from 'halleyx-ui-framework';
import 'halleyx-ui-framework/dist/es/index.css';
import './style.css';
import router from './router';

console.log(halleyxComponents);

const app = createApp(App);

Object.entries(halleyxComponents).forEach(([name, component]) => {
  app.component(name, component);
});

app.use(router);
app.mount('#app');
