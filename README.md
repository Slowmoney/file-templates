# Fast File Creator

Easily Create Files Using Templates
It must have occurred to you that you have to write duplicate code when creating each file. This extension solves this problem for you using templates!

![](https://raw.githubusercontent.com/Slowmoney/file-templates/master/images/1.png)

## How it work

To save file you must be set variables ```ext``` and ```filename```

### Examples

#### For Example

```ts
#ext:js
#filename:index
```

This example save file as ./index.js without text

#### Example With Text

```ts
#ext:js
#filename:index
function add(a, b) {
    return a + b;
}
```

This example save file as ./index.js with text

```ts
function add(a, b) {
    return a + b;
}
```

#### Example with input

```%input``` is variable from you input on call command
for example you write myAddFunction

```ts
#ext:js
#filename:%input
function add(a, b) {
    return a + b;
}
```

File saved as myAddFunction.js

#### Change casing

```%input``` is variable from you input on call command
for example you write myAddFunction

```ts
#ext:js
#filename:%input|>camel-case
function add(a, b) {
    return a + b;
}
```

File saved as my-add-function.js

#### Create many files

```%input``` is variable from you input on call command
for example you write User

```ts
#filename:%input|>kebab-case
#folder:%filename
#className:%filename
#ext:repository.ts

import type { %classNameInterface } from "./%filename.interface";

export class %classNameRepository implements %classNameInterface {}

#split
#ext:interface.ts
export interface %classNameInterface {}
```

variable ```#folder``` specifies which folder to save to
command ```#split``` indicates that this is a different file

This example save two files
```./user/user.repository.ts```
```./user/user.interface.ts```

## How to Add

Create .templates folder in .vscode

Create file with extension .template

```bash
touch ./.vscode/.templates/test.template
```

## How Write Template

```%input``` is variables from input |> pipe for change case

For example ```%input = exampleText```

```
#moduleFolder:%input|>kebab-case
#folder:%moduleFolder/domain
#ext:module.ts
#filename:domain
import { Module } from "@nestjs/common";

@Module({})
export class DomainModule {}
```

This template saves as ./example-text/domain/domain.module.ts

To save file must be set ```#filename```

Expression ```#split``` uses for create many files

### Available cases

- kebab-case
- camel-case
- pascal-case
- constant-case
- path-case
