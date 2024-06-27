import { createApp } from 'vue'
import App from './App.vue'
import Vue from 'vue';
import VueGtm from 'vue-gtm';

Vue.use(VueGtm, {
    id: 'GTM-5L2JZHRK',
});

createApp(App).mount('#app')
