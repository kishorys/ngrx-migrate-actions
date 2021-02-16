# Getting Started With ngrx-migrate-actions

This schematic can be used for migrating Ngrx6 actions and reducers to Ngrx11.

In Ngrx 6 actions are defined using classes like below.
```bash
export class LoginAction implements Action {
  readonly type = LOGIN;
  constructor(public userName: string, public password: string) { }
}
```

In Ngrx11, actions are created using `createAction` function.
```bash
export const LoginAction = createAction(
    '[LoginAction]',
    (userName: string, password: string) => ({ userName, password }),
);
```

### Usage

To use this in your project, install `ngrx-migrate-actions` and run one of below command. Reducer migrations still need more work.

If you are using `yarn` you can run this below command
```bash
yarn run ngrx-migrate-actions:convertActions --filePath <folder which contains action files>
yarn run ngrx-migrate-actions:convertReducers --filePath <folder which contains reducer files>
```

If you are using `npm` you can run this below command
```bash
npm run ngrx-migrate-actions:convertActions --filePath <folder which contains action files>
npm run ngrx-migrate-actions:convertReducers --filePath <folder which contains reducer files>
```

### Compile and build

```
npm run-script build
```

### Execute it in local

```
schematics .:convertReducers --filePath <file path> --dry-run=false
```