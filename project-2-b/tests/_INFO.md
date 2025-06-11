# Tests

We're using Jest, a popular testing framework by Facebook.

We abide by the following structural rules:

- All test files are located in the `tests` directory.
- Test files should have a `.test.js` or `.spec.js` extension.

Test suites are declared using `describe('description', () => {
    // test functions
});`

Each suite can contain a `beforeAll(async () => {})`, `afterAll(async () => {})`, and `beforeEach(async () => {})` that run before all tests, after all tests, and before each and every test, respectively.

A suite also contains many tests, denoted by:

```javascript
test('testname' async () => {
    // do some setup
    expect(something).toBe(something);
});
```

To run the suite, just use

```zsh
yarn test
```

The [Jest extension](https://marketplace.visualstudio.com/items?itemName=Orta.vscode-jest) will also be useful for viewing lists of tests.
