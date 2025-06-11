# Views

Self explainitory—as we have been doing, all `ejs` templates will be placed here. We will also be using `header.ejs` and `footer.ejs` to contain repeated elements at the top and bottom of a page.

the `include()` function is useful here:

```ejs
<%- include('header.ejs', { pageTitle: 'Home' }) %>
```
