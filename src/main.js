import Vue from 'vue'
import App from './App.vue'
import vuetify from './plugins/vuetify';
import VueTextareaAutosize from 'vue-textarea-autosize';
import firebase from 'firebase/app';
import 'firebase/firestore';

Vue.use(VueTextareaAutosize);

Vue.config.productionTip = false

firebase.initializeApp({
    apiKey: "AIzaSyAmwydwLMAM9wzPZNEnllZVw7iXSEvEkko",
    authDomain: "vue-calendar-vuetify.firebaseapp.com",
    databaseURL: "https://vue-calendar-vuetify.firebaseio.com",
    projectId: "vue-calendar-vuetify",
    storageBucket: "vue-calendar-vuetify.appspot.com",
    messagingSenderId: "515098004863",
    appId: "1:515098004863:web:053eec3dfe5156a1a3de4a"
});

export const db = firebase.firestore();

new Vue({
  vuetify,
  render: h => h(App)
}).$mount('#app')
