// postbuild.js
const { sync: globSync } = require('glob')
const fs = require('fs')
const ts = require('typescript')

// 存储已经存在的声明
const existingDeclarations = new Set()
// 将在存储中没有找到的声明放入数组，最终将其整合写入文件
let newContent = []

async function build() {
	// 获取所有的声明文件路径
	const declarationFiles = globSync('./dist/types/**/*.d.ts')

	declarationFiles.forEach((element) => {
		let declarationContent = fs.readFileSync(element, 'utf8')
		console.log(declarationContent)
		// 解析声明文件
		const sourceFile = ts.createSourceFile(element, declarationContent, ts.ScriptTarget.Latest, true)
		// 遍历声明文件的语法树
		function traverseNode(node) {
			if (ts.isModuleDeclaration(node) || ts.isImportDeclaration(node) || ts.isClassDeclaration(node) || ts.isFunctionDeclaration(node) || ts.isInterfaceDeclaration(node)) {
				// 获取声明的名称
				const name = node.name ? node.name.text : ''
				// 检查该名称是否已经存在
				if (!existingDeclarations.has(name)) {
					// 如果不存在，则将该声明节点添加至需要渲染的语法句数组
					const start = node.getStart(sourceFile)
					const end = node.getEnd()
					newContent.push(declarationContent.substring(start, end))
					existingDeclarations.add(name)
				} else {
					// 如果存在，则直接进行下一步
					return
				}
			}
			// 遍历子节点
			ts.forEachChild(node, traverseNode)
		}
		// 开始遍历语法树
		traverseNode(sourceFile)
	})
	// 写入输出文件
	fs.writeFileSync('./dist/index.d.ts', newContent.join('\r\n'))
}

build().catch(console.error)
