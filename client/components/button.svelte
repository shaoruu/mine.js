<button class="button" on:click> <slot /> </button>

<style>
  .button {
    border: none;
    border-bottom: 3px solid var(--color-darker);
    border-right: 2px solid var(--color-darker);
    border-left: 2px solid var(--color-light);
    border-top: 2px solid var(--color-light);
    box-shadow: 0 0 2px 2px var(--color-box-shadow);
    color: white;
    height: 35px;
    font-size: 15px;
    background: var(--color-primary);
    border-radius: 3px;
    text-shadow: 2px 2px var(--color-text-shadow);
    cursor: pointer;
    padding: 3px 5px;
    margin: 10px;
    width: 200px;
  }

  .button:not([disabled]):hover {
    background: var(--color-secondary);
    border-bottom: 3px solid var(--color-dark);
    border-right: 2px solid var(--color-dark);
    border-left: 2px solid var(--color-lighter);
    border-top: 2px solid var(--color-lighter);
    color: var(--color-accent);
  }

  .button:disabled {
    cursor: not-allowed;
    color: #898989;
    background: #181818;
    text-shadow: 2px 2px #363636;
    border: none;
    border: black solid 1px;
  }

  .button:focus,
  .button:active {
    outline: none;
  }
</style>
