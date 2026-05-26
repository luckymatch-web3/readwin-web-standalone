<template><div class="exp-bar"><div :style="{width: percent+'%'}"></div></div></template>
<script setup lang="ts">defineProps<{percent?: number}>()</script>
