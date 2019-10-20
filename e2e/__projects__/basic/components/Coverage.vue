<template>
  <div />
</template>

<script>
const coveredFn = () => {
  const statement = true ? 'I' : 'E'
}
const uncoveredFn = () => {}

const branch = true
if (branch) {
  coveredFn()
} else {
  uncoveredFn()
}

export default {
  name: 'coverage'
}
</script>
