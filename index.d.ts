export function engine(): (
    filePath: string,
    data: Partial<{}>,
    callback: (arg1: string, arg2: string) => {}
) => void