class Game {
	constructor() {
		// 基础信息
		this.config = {
			background: 0x282828,
			ground: -1,
			cubeColor: 0xbebebe,
			cubeWidth: 4,
			cubeHeight: 2,
			cubeDeep: 4,
			jumperColor: 0x232323,
			jumperWidth: 1,
			jumperHeight: 2,
			jumperDeep: 1
		}
		this.score = 0
		this.scene = new THREE.Scene()
		this.renderer = new THREE.WebGLRenderer({ antialias: true })
		this.size = {
			width: window.innerWidth,
			height: window.innerHeight
		}
		// 正交相机
		this.camera = new THREE.OrthographicCamera(window.innerWidth / -50, window.innerWidth / 50, window.innerHeight / 50, window.innerHeight / -50, 0, 5000)
		// 相机的位置
		this.cameraPos = {
			current: new THREE.Vector3(0, 0, 0),
			next: new THREE.Vector3()
		}
		// 方块
		this.cubes = []
		// 方块左边 or 右边
		this.cubeStat = {
			nextDir: ''
		}
		// 落后的状态
		this.falledStat = {
			// 默认落在当前块上
			location: -1,
			// 距离，根据距离判断是否倒下去
			distance: 0
		}
		// 是否下落完成
		this.fallingStat = {
			end: false,
			speed: 0.2
		}
		// 速度
		this.jumperStat = {
			ready: false,
			xSpeed: 0,
			ySpeed: 0
		}
	}

	init() {
		// this._addAxisHelp()
		this._setCamera()
		this._setRenderer()
		this._setLight()
		this._createCube()
		this._createCube()
		this._createJumper()
		this._updateCamera()
		this._handleWindowResize()
		window.addEventListener('resize', () => {
			this._handleWindowResize()
		})
		// 给当前canvas绑定事件
		let canvas = document.querySelector('canvas')
		canvas.addEventListener('mousedown', () => {
			this._handleMouseDown()
		})
		canvas.addEventListener('mouseup', () => {
			this._handleMouseUp()
		})
	}

	_addSuccessFn(fn) {
		this.successCallback = fn
	}

	_addFailedFn(fn) {
		this.failedCallback = fn
	}

	_addAxisHelp() {
		let axis = new THREE.AxisHelper(20)
		this.scene.add(axis)
	}

	_handleWindowResize() {
		this._setSize()
		this.camera.left = this.size.width / -50
		this.camera.righ = this.size.width / 50
		this.camera.top = this.size.height / 50
		this.camera.botom = this.size.height / -50
		this.camera.updateProjectionMatrix()
		this.renderer.setSize(this.size.width, this.size.height)
		this._render()
	}

	_handleMouseDown() {
		if (!this.jumperStat.ready && this.jumper.scale.y > 0.02) {
			// y方向，压缩当前块
			this.jumper.scale.y -= 0.01
			this.jumperStat.xSpeed += 0.004
			this.jumperStat.ySpeed += 0.008
			this._render()
			requestAnimationFrame(() => {
				this._handleMouseDown()
			})
		}
	}

	_handleMouseUp() {
		this.jumperStat.ready = true
		// >= 1还在空中，没有结束跳跃过程
		if (this.jumper.position.y >= 1) {
			if (this.jumper.scale.y < 1) {
				this.jumper.scale.y += 0.1
			}
			// 如果往左边跑
			if (this.cubeStat.nextDir === 'left') {
				this.jumper.position.x -= this.jumperStat.xSpeed
			} else {
				this.jumper.position.z -= this.jumperStat.xSpeed
			}
			this.jumperStat.ySpeed -= 0.01
			this.jumper.position.y += this.jumperStat.ySpeed
			this._render()
			requestAnimationFrame(() => {
				this._handleMouseUp()
			})
		} else {
			this.jumperStat.ready = false
			// 恢复默认值
			this.jumper.scale.y = 1
			this.jumper.position.y = 1
			this.jumperStat.xSpeed = 0
			this.jumperStat.ySpeed = 0
			// 检测落在哪里了
			this._checkInCube()
			if (this.falledStat.location === 1) {
				// 如果成功了
				this.score++
				this._createCube()
				this._updateCamera()
				if (this.successCallback) {
					this.successCallback(this.score)
				}
			} else {
				// 失败
				this._falling()
			}
		}
	}

	_checkInCube() {
		// -1：当前盒子
		// -10：当前盒子上滑下去
		// 1：跳到下一个盒子
		// 10：从下一个盒子上掉落
		// 0：没有落在盒子上
		let distanceCur, distanceNext
		let should = (this.config.cubeWidth + this.config.jumperWidth) / 2
		if (this.cubeStat.nextDir === 'left') {
			distanceCur = Math.abs(this.cubes[this.cubes.length - 2].position.x - this.jumper.position.x)
			distanceNext = Math.abs(this.cubes[this.cubes.length - 1].position.x - this.jumper.position.x)
		} else {
			distanceCur = Math.abs(this.cubes[this.cubes.length - 2].position.z - this.jumper.position.z)
			distanceNext = Math.abs(this.cubes[this.cubes.length - 1].position.z - this.jumper.position.z)
		}

		if (distanceCur < should) {
			// 落在当前块
			this.falledStat.location = distanceCur < this.config.cubeWidth / 2 ? -1 : -10
		} else if (distanceNext < should) {
			// 落在下一个块
			this.falledStat.location = distanceNext < this.config.cubeWidth / 2 ? 1 : 10
		} else {
			// 没有落在块上
			this.falledStat.location = 0
		}
	}

	_falling() {
		// -10，10，0
		// -10从当前盒子落下，左前或者右前方 leftTop rightTop
		// 10从下一个盒子落下 leftTop leftBottom rightTop rightBottom
		// 0 none
		if (this.falledStat.location === 10) {
			if (this.cubeStat.nextDir === 'left') {
				if (this.jumper.position.x > this.cubes[this.cubes.length - 1].position.x) {
					this._fallingDir('leftBottom')
				} else {
					this._fallingDir('leftTop')
				}
			} else {
				if (this.jumper.position.z > this.cubes[this.cubes.length - 1].position.z) {
					this._fallingDir('rightBottom')
				} else {
					this._fallingDir('rightTop')
				}
			}
		} else if (this.falledStat.location === -10) {
			if (this.cubeStat.nextDir === 'left') {
				this._fallingDir('leftTop')
			} else {
				this._fallingDir('rightTop')
			}
		} else if (this.falledStat.location === 0) {
			this._fallingDir('none')
		}
	}

	_fallingDir(dir) {
		console.log(dir)
		let offset = this.falledStat.distance - this.config.cubeWidth / 2
		let isRotate = true
		let axis = dir.includes('left') ? 'z' : 'x'
		let rotate = this.jumper.rotation[axis]
		let fallingTo = this.config.ground + this.config.jumperWidth / 2
		if (dir === 'leftTop') {
			rotate += 0.1
			isRotate = this.jumper.rotation[axis] < Math.PI / 2
			console.log(isRotate)
		} else if (dir === 'leftBottom') {
			rotate -= 0.1
			isRotate = this.jumper.rotation[axis] > -Math.PI / 2
			console.log(isRotate)
		} else if (dir === 'rightTop') {
			rotate -= 0.1
			isRotate = this.jumper.rotation[axis] > -Math.PI / 2
			console.log(isRotate)
		} else if (dir === 'rightBottom') {
			rotate += 0.1
			isRotate = this.jumper.rotation[axis] < Math.PI / 2
			console.log(isRotate)
		} else if (dir === 'none') {
			fallingTo = this.config.ground
			isRotate = false
		}
		if (!this.fallingStat.end) {
			if (isRotate) {
				this.jumper.rotation[axis] = rotate
			} else if (this.jumper.position.y > fallingTo) {
				this.jumper.position.y -= this.fallingStat.speed
			} else {
				this.fallingStat.end = true
			}
			this._render()
			requestAnimationFrame(() => {
				this._falling()
			})
		} else {
			if (this.failedCallback) {
				this.failedCallback()
			}
		}
	}

	// 设置相机位置
	_setCamera() {
		this.camera.position.set(100, 100, 100)
		// 对准镜头
		this.camera.lookAt(this.cameraPos.current)
	}

	// 设置render
	_setRenderer() {
		this.renderer.setSize(this.size.width, this.size.height)
		this.renderer.setClearColor(this.config.background)
		document.body.appendChild(this.renderer.domElement)
	}

	// 创建cube
	_createCube() {
		let geometry = new THREE.CubeGeometry(this.config.cubeWidth, this.config.cubeHeight, this.config.cubeDeep)
		let material = new THREE.MeshLambertMaterial({ color: this.config.cubeColor })
		let cube = new THREE.Mesh(geometry, material)
		if (this.cubes.length) {
			// 随机一个方向 left x轴的负方向 right z轴
			this.cubeStat.nextDir = Math.random() > 0.5 ? 'left' : 'right'
			console.log(this.cubeStat.nextDir)
			cube.position.x = this.cubes[this.cubes.length - 1].position.x
			cube.position.y = this.cubes[this.cubes.length - 1].position.y
			cube.position.z = this.cubes[this.cubes.length - 1].position.z
			if (this.cubeStat.nextDir === 'left') {
				// 改变x轴
				cube.position.x -= Math.random() * 4 + 6
			} else {
				// 改变z轴
				cube.position.z -= Math.random() * 4 + 6
			}
		}
		this.cubes.push(cube)
		if (this.cubes.length > 6) {
			// 删除第一项，并且从场景中删除
			this.scene.remove(this.cubes.shift())
		}
		this.scene.add(cube)
		if (this.cubes.length > 1) {
			// 更新镜头的位置
			this._updateCameraPos()
		}
	}
	_createJumper() {
		let geometry = new THREE.CubeGeometry(this.config.jumperWidth, this.config.jumperHeight, this.config.jumperDeep)
		let material = new THREE.MeshLambertMaterial({ color: this.config.jumperColor })
		this.jumper = new THREE.Mesh(geometry, material)
		// 游戏结束，底部开始旋转，抬高1
		geometry.translate(0, 1, 0)
		this.jumper.position.y = 1
		this.scene.add(this.jumper)
	}

	// 更新镜头的位置
	_updateCameraPos() {
		// 计算出next，镜头对准最后两个块的最中间，数组的倒数第二个和最后一个
		let lastIndex = this.cubes.length - 1
		let pointA = {
			x: this.cubes[lastIndex - 1].position.x,
			z: this.cubes[lastIndex - 1].position.z
		}
		let pointB = {
			x: this.cubes[lastIndex].position.x,
			z: this.cubes[lastIndex].position.z
		}
		this.cameraPos.next = new THREE.Vector3((pointA.x + pointB.x) / 2, 0, (pointA.z + pointB.z) / 2)
	}

	// 改变相机的镜头
	_updateCamera() {
		if (this.cameraPos.current.x > this.cameraPos.next.x || this.cameraPos.current.z > this.cameraPos.next.z) {
			if (this.cubeStat.nextDir === 'left') {
				this.cameraPos.current.x -= 0.2
			} else {
				this.cameraPos.current.z -= 0.2
			}
			if (this.cameraPos.current.x - this.cameraPos.next.x < 0.05) {
				this.cameraPos.current.x = this.cameraPos.next.x
			} else if (this.cameraPos.current.z - this.cameraPos.next.z < 0.05) {
				this.cameraPos.current.z = this.cameraPos.next.z
			}

			this.camera.lookAt(this.cameraPos.current)
			this._render()
			requestAnimationFrame(() => {
				this._updateCamera()
			})
		}
	}

	// 设置灯光
	_setLight() {
		let directionalLight = new THREE.DirectionalLight(0xffffff, 1.1)
		directionalLight.position.set(3, 10, 5)
		this.scene.add(directionalLight)
		// 全景光，增加亮度
		let light = new THREE.AmbientLight(0xffffff, 0.3)
		this.scene.add(light)
	}

	// 渲染 
	_render() {
		this.renderer.render(this.scene, this.camera)
	}

	// 设置size
	_setSize() {
		this.size = {
			width: window.innerWidth,
			height: window.innerHeight
		}
	}

	_restart() {
		// 重置
		this.score = 0
		this.falledStat = {
			location: -1,
			distance: 0
		}
		this.cameraPos = {
			current: new THREE.Vector3(0, 0, 0),
			next: new THREE.Vector3(0, 0, 0)
		}
		// 删除场景中的几何体
		this.scene.remove(this.jumper)
		this.cubes.forEach(cube => this.scene.remove(cube))
		this.cubes = []
		// 重新开始
		this._createCube()
		this._createCube()
		this._createJumper()
		this._updateCamera()
	}
}