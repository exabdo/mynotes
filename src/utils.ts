import { files, fileType } from "./types"

//export const URL_API = 'https://retoolapi.dev/ttTL6H/data'
export const URL_API = 'https://retoolapi.dev/41py8X/data'

export const sortFiles = (files: files[]) => {
    console.log('sortFiles')
    const copyArr = [...files]
    return copyArr.sort((a, b) => a.fileName > b.fileName ? 1 : -1)
}

export async function createFilenameAPI(id: number, newFilename: string, parentId: number){
    console.log({id: id, fileName: newFilename, content: '', parentId: 0})
    const response = await fetch(`${URL_API}`, {
        method: 'POST', // *GET, POST, PUT, DELETE, etc.
        mode: 'cors', // no-cors, *cors, same-origin
        cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
        credentials: 'same-origin', // include, *same-origin, omit
        headers: {
          'Content-Type': 'application/json'
        },
        redirect: 'follow', // manual, *follow, error
        referrerPolicy: 'no-referrer', // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
        body: JSON.stringify({id: id, fileName: newFilename, content: '', parentId: 0}) // body data type must match "Content-Type" header
    })
    

    const data = await response.json()    
    if(!response.ok) throw new Error(response.status.toString())
    return data?.fileName === newFilename
}

export async function updateFilenameAPI(id: number, fileName: string, content: string, parentId: number, type: fileType){
    const response = await fetch(`${URL_API}/${id}`, {
        method: 'PUT', // *GET, POST, PUT, DELETE, etc.
        mode: 'cors', // no-cors, *cors, same-origin
        cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
        credentials: 'same-origin', // include, *same-origin, omit
        headers: {
          'Content-Type': 'application/json'
        },
        redirect: 'follow', // manual, *follow, error
        referrerPolicy: 'no-referrer', // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
        body: JSON.stringify({fileName: fileName, content: content, parentId: parentId}) // body data type must match "Content-Type" header
    })

    console.log(content)

    if(!response.ok) throw new Error(response.status.toString())

    const data = await response.json()
    return data?.fileName === fileName
}

export async function deleteFilenameAPI(id: number){
    const response = await fetch(`${URL_API}/${id}`, {
        method: 'DELETE', 
        mode: 'cors', // no-cors, *cors, same-origin
        cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
        credentials: 'same-origin', // include, *same-origin, omit
        headers: {
          'Content-Type': 'application/json'
        },
        redirect: 'follow', // manual, *follow, error
        referrerPolicy: 'no-referrer', // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url			
    })

    if(!response.ok) throw new Error(response.status.toString())
    return response.ok
}


export function getFileById(fileList: files[], id: number): files | undefined {
    //return fileList.find((item) => item.id === id)?.fileName || undefined;
    let result: files | undefined = undefined

    const findObj = (fileList: files[]) => {
        let res = fileList.find(file => {
            if(file?.childNodes?.length && file.childNodes.length > 0) findObj(file.childNodes)
            return file.id === id
        })

        if (res) result = res
        return result
    }

    return findObj(fileList);
}

export function getUpdatedFileList(fileList: files[], objFile: files): files[] | undefined {
    //const files = [...fileList]
    const files = structuredClone(fileList);
    let result: files | undefined = undefined

    const findObj = (files: files[]) => {
        let res = files.find(file => {
            if(file?.childNodes?.length && file.childNodes.length > 0) findObj(file.childNodes)
            return file.id === objFile.id
        })

        if (res) result = res
        return result
    }

    let obj = findObj(files)
    if (obj) {
        obj = objFile
        return files
    }

    return undefined
}


export async function saveFileContentToApiAndGetUpdatedState(fileList: files[], idFile: number, content: string) {
    const fileObj = getFileById(fileList, idFile);
    if(!fileObj) return undefined
    fileObj.content = content
 			
    if (await updateFilenameAPI(
            fileObj.id,
            fileObj.fileName,
            fileObj.content,
            fileObj.parentId,
            fileObj?.childNodes ? 'FOLDER' : 'FILE'					
        )
    ) {
        return getUpdatedFileList(fileList, fileObj)            
    }

    return undefined 
};

export async function renameFilenameToApiAndGetUpdatedState(fileList: files[], idFile: number, newFilename: string) {
    const fileObj = getFileById(fileList, idFile);
    if(!fileObj) return undefined
    fileObj.fileName = newFilename
 			
    if (await updateFilenameAPI(
            fileObj.id,
            fileObj.fileName,
            fileObj.content,
            fileObj.parentId,
            fileObj?.childNodes ? 'FOLDER' : 'FILE'					
        )
    ) {
        return getUpdatedFileList(fileList, fileObj)            
    }

    return undefined 
};