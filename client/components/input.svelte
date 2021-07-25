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
    color: rgb(168, 168, 168);
    margin-bottom: 0.8em;
  }

  .inputField p {
    overflow: hidden;
    text-overflow: ellipsis;
    width: 100%;
    text-align: center;
    white-space: nowrap;
  }

  .inputField input {
    width: 80%;
    line-height: 24px;
    background: black;
    color: white;
    padding: 5px;
    border: 2px solid #566da1;
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
