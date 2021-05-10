<button class="button" on:click> <slot /> </button>

<style>
  .button {
    font-family: 'Alata', sans-serif;
    border: none;
    border-bottom: 3px solid #35425f;
    border-right: 2px solid #35425f;
    border-left: 2px solid #728ecf;
    border-top: 2px solid #728ecf;
    box-shadow: 0 0 2px 2px black;
    color: white;
    height: 35px;
    font-size: 15px;
    background: #465881;
    border-radius: 3px;
    text-shadow: 2px 2px #4c4c4c;
    cursor: pointer;
    padding: 3px 5px;
    margin: 10px;
    width: 200px;
  }

  .button:not([disabled]):hover {
    background: #7c8bbc;
    border-bottom: 3px solid #59639a;
    border-right: 2px solid #59639a;
    border-left: 2px solid #bdc6ff;
    border-top: 2px solid #bdc6ff;
    color: #f8f6a4;
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
