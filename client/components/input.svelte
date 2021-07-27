<script lang="typescript">
  export let title: string = '';
  export let value: string;
</script>

<div class="inputField">
  {#if !!title}
    <p>{title}</p>
  {/if}
  <input bind:value on:input type="text" {...$$restProps} />
</div>

<style>
  .inputField {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    margin-bottom: 0.8em;
  }

  .inputField p {
    overflow: hidden;
    color: var(--color-text-secondary);
    text-overflow: ellipsis;
    width: 100%;
    text-align: center;
    white-space: nowrap;
  }

  .inputField input {
    width: 70%;
    line-height: 24px;
    background: black;
    color: white;
    padding: 5px;
    border: 2px solid var(--color-primary);
    border-radius: 10px;
    margin: 8px;
    font-size: 16px;
    text-align: center;
  }

  .inputField input:active,
  .inputField input:focus {
    outline: none;
  }
</style>
