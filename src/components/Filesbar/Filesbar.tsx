import React, { useState, useRef, useContext } from "react";
import { AppContext, AppContextType } from "../../Context";
import ContexMenu from "../ContexMenu";
import ModalDialog from "../ModalDialog";
import FileItem from "./FileItem";
import { files, fileType } from "../../types";
import { getFileById } from "../../utils"
import "./Filesbar.css";


interface FilesbarProps {
	title?: string;
}

function Filesbar({title}: FilesbarProps) {

	const { 
		fileList, 
		setFileList, 

		activeFile,
		setActiveFile,
		
		createNewFile, 
		renameFilename,
		deleteFile

	} = useContext(AppContext) as AppContextType;

	const [focused, setFocused] = useState(false)
	const [showInputNewFileAtParent, setShowInputNewFileAtParent] = useState(-1)
	const [renameFileName, setRenameFileName] = useState({
		fileId: 0,
		newName: "",
	});

	const [error, setError] = useState({
		error: "",
		left: 0,
		top: 0,
		width: 0,
	})

	const [showMenu, setShowMenu] = useState({
		show: false,
		x: 0,
		y: 0,
		fileId: 0,
	})

	const [showDialogConfirmDelete, setShowDialogConfirmDelete] = useState(false)
	const [showDialogConfirmDeleteParams, setShowDialogConfirmDeleteParams] = useState({fileName: '', fileId: 0})

	const inputRenameRef = useRef(null);

	const errorFileExists = (fileName: string) =>
		`A file or folder ${fileName} already exists at this location. Please choose a different name.`;

	const onFileRenamed = async(
		fileId: number,
		success: boolean,
		newFilename: string,
		inputEl: any
	) => {		
		setError({ error: '', left: 0, top: 0, width: 0 });	
		inputEl.current.style.outline = "";
		
		if (success) {					
			try {
				//await updateFile({...objFile, fileName: newFilename, parentId: 0})								
				await renameFilename(fileId, newFilename)
				setRenameFileName({ fileId: 0, newName: "" })
			} catch(e) {					
				alert(e)
			}
					
		} else {
			setRenameFileName({ fileId: 0, newName: "" });
		}
	};

	const onFileCreated = async(success: boolean, filename: string, inputEl: any) => {
		setError({ error: '', left: 0, top: 0, width: 0 });	
		inputEl.current.style.outline = "1px solid #252525";

		if (success) {
			try {
				await createNewFile(filename, showInputNewFileAtParent)
				setShowInputNewFileAtParent(-1)
			} catch(e) {
				alert(e)
			}
		} else {
			setShowInputNewFileAtParent(-1)
		}				
	}

	const onContextMenu = (
		e: React.MouseEvent<HTMLDivElement>,
		fileId: number
	) => {
		e.preventDefault();
		setShowMenu({
			show: true,
			x: e.pageX,
			y: e.pageY,
			fileId: fileId,
		});
	};


	const onClickItem = async(fileId: number, itemId: string) => {
		if (itemId === "NEW_FILE") {
			setShowInputNewFileAtParent(0)
		}
				
		if (itemId === "EDIT_FILE") {
			const fileName = fileList.find((item) => item.id === fileId)?.content || ''
			setRenameFileName({fileId: fileId, newName: fileName })
			setTimeout(() => {
				//@ts-ignore
				if (inputRenameRef) inputRenameRef?.current?.select()
			}, 0);
		}

		if (itemId === "DELETE_FILE") {			
			const fileObj = fileList.find(item => item.id === fileId)
			setShowDialogConfirmDeleteParams({fileId: fileId, fileName: fileObj?.fileName || ''})
			setShowDialogConfirmDelete(true)
		}
	};


	const onButtonClickModalDlgConfirmDelete = async(idButton: string) => {
		if(idButton === 'DELETE') {
			try {
				if (await deleteFile(showDialogConfirmDeleteParams.fileId)) {
					const newFileList = fileList.filter(item => item.id !== showDialogConfirmDeleteParams.fileId)
					setFileList(newFileList)
				} 
			} catch(e) {
				alert(e)
		   }			
		}
	}


	const onChangeValidator = (
		fileId: number,
		fileName: string,
		inputEl: any
	): boolean => {

		const result = fileList.every(item => item.fileName !== fileName || fileId === item.id)

		if (!result && inputEl) {
			inputEl.current.style.outline = "1px solid red";
			const elRect = inputEl.current.getBoundingClientRect();
			setError({
				error: errorFileExists(fileName),
				left: elRect.left-1,
				top: elRect.bottom - 1,
				//width: elRect.right - elRect.left + 2,
				width: inputEl?.current?.offsetWidth+2 ?? 0
			});
		} else {
			inputEl.current.style.outline = "";
			setError({ error: '', left: 0, top: 0, width: 0 });			
		}

		return result;			
	};


	const onClickFileItem = (file: files) => {
		setActiveFile(file.id)	
		
		if(file?.childNodes) {
			const newFileList = changeIsOpenedAndUpdateFileList(fileList, file.id)		
			newFileList && setFileList(newFileList)
		}
	}

	function changeIsOpenedAndUpdateFileList(fileList: files[], idFile: number): files[] | undefined {

		const mapItems = (files: files[]): files[] => {
			return files.map((file: files) => {
				if (file?.childNodes) {
					if(file.id === idFile) {
						return {...file, childNodes: mapItems(file.childNodes), isOpened: !file.isOpened}
					}
					return {...file, childNodes: mapItems(file.childNodes)}
				} else {
					return file
				}
			})
		}
	
		return mapItems(fileList)
	}

	const onClickButtonNewFile = () => {
		if(activeFile !== undefined){
			const objFile = getFileById(fileList, activeFile)
			objFile && setShowInputNewFileAtParent(objFile.parentId)
			return
		}		

		setShowInputNewFileAtParent(0)
	}


	const renderFiles = (files: files[], newFileAtParent: number) => {

		const render = (file: files, level: number) => {
			const fileItemEl = (
				<FileItem
					fileObj={file}
					selected={activeFile === file.id}
					focused={focused}
					mode={renameFileName.fileId === file.id ? 'RENAME_FILE' : undefined}
					onClick={onClickFileItem}
					onMenu={(e, fileId) => onContextMenu(e, fileId)}
					onFileRenamed={onFileRenamed}
					onChangeValidator={onChangeValidator}
					key={file.id}
					level={level}					
				>	
					{						
						file?.childNodes && file.isOpened && file.childNodes.map((file: any) => render(file, level+1))
					}
				</FileItem>					
			)

			
			if (file.parentId == newFileAtParent) {
				newFileAtParent = -1
				console.log('file.parentId === newFileAtParent')
				return (
					<React.Fragment key={file.id}>
						<FileItem
							fileObj={{id: 0, fileName: '', content: '', parentId: 0}}	
							selected={false}
							focused={focused}		
							mode='NEW_FILE'			
							onFileCreated={onFileCreated}
							onChangeValidator={onChangeValidator}
							key={'newFile'}
							level={level}
						/>

						{fileItemEl}
					</React.Fragment>				
				)
			}

			return (fileItemEl)			
		}

		return files.map((file: any) => render(file, 0))

	}


	// const renderFiles = (file: files, level: number, showNewFile: boolean) => {

	// 	if (showNewFile) {
	// 		showNewFile = false
	// 		return (			
	// 			<FileItem
	// 				fileObj={{id: 0, fileName: '', content: '', parentId: 0}}	
	// 				selected={false}
	// 				focused={focused}		
	// 				mode='NEW_FILE'			
	// 				onFileCreated={onFileCreated}
	// 				onChangeValidator={onChangeValidator}
	// 				key={'newFile'}
	// 				level={0}
	// 			/>			
	// 		)

	// 	}


	// 	return (
	// 		<FileItem
	// 			fileObj={file}
	// 			selected={activeFile === file.id}
	// 			focused={focused}
	// 			mode={renameFileName.fileId === file.id ? 'RENAME_FILE' : undefined}
	// 			onClick={onClickFileItem}
	// 			onMenu={(e, fileId) => onContextMenu(e, fileId)}
	// 			onFileRenamed={onFileRenamed}
	// 			onChangeValidator={onChangeValidator}
	// 			key={file.id}
	// 			level={level}					
	// 		>	
	// 			{						
	// 				file?.childNodes && file.isOpened && file.childNodes.map((file: any) => renderFiles(file, level+1, false))
	// 			}
	// 		</FileItem>	
			
	// 	)
	// }
	

	return (
		<div
			className="filesbar"
			tabIndex={0}
			onFocus={() => setFocused(true)}
			onBlur={() => {
				setFocused(false);
			}}
			onContextMenu={(e) => onContextMenu(e, 0)}
		>
			<span>EXPLORER</span>
			<div className="files">
				<div className="filesTitle">
					{title && <span>{title}</span>}
					<i
						className="fa-regular fa-file"
						onClick={onClickButtonNewFile}
					></i>
				</div>

				<div style={{ position: "relative" }}>

					{/* { showInputNewFile && 
						<FileItem
							fileObj={{id: 0, fileName: '', content: '', parentId: 0}}	
							selected={false}
							focused={focused}		
							mode='NEW_FILE'			
							onFileCreated={onFileCreated}
							onChangeValidator={onChangeValidator}
							key={'newFile'}
							level={0}
					/>
					} */}


					{/* {fileList.map((file: any) => renderFiles(file, 0, true))} */}
					{renderFiles(fileList, showInputNewFileAtParent)}


					{(renameFileName.fileId !== 0 || showInputNewFileAtParent > -1) && (
						<div
							style={{
								position: "absolute",
								left: "0",
								top: "0",
								backgroundColor: "hsla(0, 0%, 15%, 0.7)",
								zIndex: "1",
								bottom: "0",
								right: "0",
							}}
						></div>
					)}
				</div>
			</div>

			{showMenu.show && (
				<ContexMenu
					showMenu={showMenu}
					onClickItem={onClickItem}
					setShowMenu={setShowMenu}
				/>
			)}

			{error.error && (
				<div
					className='error'
					style={{
						position: "fixed",
						left: error.left,
						top: error.top,
						width: error.width,
						border: "1px solid red",
						backgroundColor: "#500000",
						padding: "3px 8px 3px 8px",
						zIndex: "3",
					}}
				>
					<span>{error.error}</span>
				</div>
			)}

		
			<ModalDialog
				title="Confirm"
				message={`Are you sure you want to delete '${showDialogConfirmDeleteParams.fileName}'?`}
				faIcon="fa-regular fa-circle-question"
				buttons={[
					{ idButton: "DELETE", caption: "Delete" },					
					{ idButton: "CANCEL", caption: "Cancel" },
				]}
				onButtonClick={onButtonClickModalDlgConfirmDelete}
				show={showDialogConfirmDelete}
				setShow={setShowDialogConfirmDelete}					
			/>
		



		</div>
	);
}

export default Filesbar;
