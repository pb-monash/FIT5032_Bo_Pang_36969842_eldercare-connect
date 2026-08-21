import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

const githubPagesBase = '/FIT5032_Bo_Pang_36969842_eldercare-connect/'

export default defineConfig({
  base: process.env.GITHUB_PAGES === 'true' ? githubPagesBase : '/',
  plugins: [vue()],
})
