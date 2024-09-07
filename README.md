# Fast File Creator

Easily Create Files Using Templates
It must have occurred to you that you have to write duplicate code when creating each file. This extension solves this problem for you using templates!

## How to Add

Create .templates folder in .vscode

Create file with extension .template

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

kebab-case
camel-case
pascal-case
constant-case
path-case
