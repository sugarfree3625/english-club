<template>
  <div class="container" style="text-align:center;padding:80px 20px">
    <h1>Сброс пароля</h1>
    <input class="input" v-model="email" placeholder="Email" style="max-width:300px;margin:20px auto;display:block">
    <button class="btn btn-p" @click="reset">Отправить</button>
  </div>
</template>

<script>
import axios from 'axios';
export default {
  data() { return { email: '' }; },
  methods: {
    async reset() {
      await axios.post('/api/reset-password', { email: this.email });
      alert('Инструкции отправлены на email');
    }
  }
};
</script>
