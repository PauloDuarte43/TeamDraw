import { createApp } from 'vue'
import App from './App.vue'
import VueGtm from 'vue-gtm';

Vue.use(VueGtm, {
    id: 'GTM-5L2JZHRK',
});

createApp(App).mount('#app')
