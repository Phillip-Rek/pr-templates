
# <div align="center"> Pr Templates </div>

- Pr Templates is a simplified, lightweight JavaScript Templating Engine. 
- This templating engine can work in Node Js, with Express JS.

## Homepage 
[phillip-rek.github.io](https://Phillip-Rek.github.io/)

## Repository
[github.com/Phillip-Rek/perthite](https://github.com/Phillip-Rek/pr-templates)

##  Usage Example 

```
{% template navBar(pages) %}
    <nav>
        {% for(let page of pages) %}
            <a href="${page.url}">{{ page.name }}</a>
        {% end_for %} 
    </nav>
{% end_template %}

{% call: navBar([{ name: "Home", url: "/" }, { name: "About", url: "about" }]) %}
```

## Installing 

```npm i perthite-2```
  
## Documentation
Documentation can be found on the [wiki](https://github.com/Phillip-Rek/pr-templates/wiki) page as well as on the [github page](https://Phillip-Rek.github.io/)

## Bug Reporting

Your Issues are more welcome, Help us improve Perthite by reporting any bugs you may encounter.

## Contributing

Check out for open issues and start contributing. You can also contribute by improving the documentation or you can write articles about Perthite. Another way of contributing is by asking for features, we would like to hear what features would you like is to implement on this library.

## License
[MIT](https://opensource.org/licenses/MIT)

Copyright (c) 2020 Phillip Rekhotho


