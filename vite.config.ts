import { defineConfig } from 'vite';
import { resolve } from 'path';

// Опциональные плагины
import tsconfigPaths from 'vite-tsconfig-paths';
export default defineConfig({
  plugins: [
    tsconfigPaths(), // Автоматическая поддержка алиасов из tsconfig.json
  ],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/utilitiesArbitraryValues.ts'), // Ваша точка входа
      name: 'UtilArbitraryValuesCss', // Имя глобальной переменной, если виджет подключается через <script>
      fileName: (format) => `utilArbitrary.${format}.js`, // Именование выходных файлов
    },
    rollupOptions: {
      output: {
        // Отключаем разделение кода, чтобы получить один файл
        inlineDynamicImports: true,
      },
    },
    target: 'es2015', // Поддержка старых браузеров (при необходимости)
    minify: 'esbuild', // Минификация кода
    sourcemap: true, // Генерация sourcemap для отладки
  },
});
