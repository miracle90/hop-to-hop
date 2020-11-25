class Game {
	constructor() {
		// 基础信息配置
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
		this.size = {
			width: window.innerWidth,
			height: window.innerHeight
		}
		this.score = 0
		// 新建一个场景
		this.scene = new THREE.Scene()
		// 新建一个渲染器
		this.renderer = new THREE.WebGLRenderer({ antialias: true })
		// 新建一个正交相机，不需要近大远小的效果
		this.camera = new THREE.OrthographicCamera(window.innerWidth / -50, window.innerWidth / 50, window.innerHeight / 50, window.innerHeight / -50, 0, 5000)
		// 相机的位置
		this.cameraPos = {
			current: new THREE.Vector3(0, 0, 0),
			next: new THREE.Vector3()
		}
		// 方块的集合
		this.cubes = []
		// 随机生成的方块方向，left，right
		this.cubeStat = {
			nextDirection: ''
		}
		// jumper下落后的状态
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
		this._addAxisHelp()
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
		// 如果可点击，并且还未到极限位置
		if (!this.jumperStat.ready && this.jumper.scale.y > 0.02) {
			// y方向，压缩当前块
			this.jumper.scale.y -= 0.01
			// 积蓄速度，x，y方向的速度
			this.jumperStat.xSpeed += 0.004
			this.jumperStat.ySpeed += 0.008
			this._render()
			requestAnimationFrame(() => {
				this._handleMouseDown()
			})
		}
	}
	_handleMouseUp() {
		// 跳跃过程，不可点击
		this.jumperStat.ready = true
		// >= 1还在空中，没有结束跳跃过程
		if (this.jumper.position.y >= 1) {
			// jumper的压缩状态逐渐恢复
			if (this.jumper.scale.y < 1) {
				this.jumper.scale.y += 0.1
			}
			if (this.cubeStat.nextDirection === 'left') {
				// 如果往左边跳，x减小
				this.jumper.position.x -= this.jumperStat.xSpeed
			} else {
				// 如果往左边跳，z减小
				this.jumper.position.z -= this.jumperStat.xSpeed
			}
			// y轴方向，速度不断减小，正数 => 0 => 负数
			this.jumperStat.ySpeed -= 0.01
			// 改变jumper的高度值
			this.jumper.position.y += this.jumperStat.ySpeed
			this._render()
			requestAnimationFrame(() => {
				this._handleMouseUp()
			})
		} else {
			// 跳跃结束，恢复可点击
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
				// 创建下一个方块
				this._createCube()
				// 更新相机lookAt
				this._updateCamera()
				if (this.successCallback) {
					// 成功跳跃，计算分数
					this.successCallback(this.score)
				}
			} else {
				// 失败，执行滚动动画
				this._falling()
			}
		}
	}
	// 检测落在哪里了
	_checkInCube() {
		// -1：还在当前方块上
		// -10：当前盒子上滑下去
		// 1：跳到下一个盒子
		// 10：从下一个盒子上掉落
		// 0：没有落在盒子上
		let distanceCur, distanceNext
		let should = (this.config.cubeWidth + this.config.jumperWidth) / 2
		if (this.cubeStat.nextDirection === 'left') {
			// jumper和当前方块的中心点的距离
			distanceCur = Math.abs(this.cubes[this.cubes.length - 2].position.x - this.jumper.position.x)
			// jumper和要跳的方块的中心点的距离
			distanceNext = Math.abs(this.cubes[this.cubes.length - 1].position.x - this.jumper.position.x)
		} else {
			// jumper和当前方块的中心点的距离
			distanceCur = Math.abs(this.cubes[this.cubes.length - 2].position.z - this.jumper.position.z)
			// jumper和要跳的方块的中心点的距离
			distanceNext = Math.abs(this.cubes[this.cubes.length - 1].position.z - this.jumper.position.z)
		}

		if (distanceCur < should) {
			// 落在当前块 or 从当前方块滑落
			this.falledStat.location = distanceCur < this.config.cubeWidth / 2 ? -1 : -10
		} else if (distanceNext < should) {
			// 落在下一个方块 or 从下一个方块滑落
			this.falledStat.location = distanceNext < this.config.cubeWidth / 2 ? 1 : 10
		} else {
			// 没有落在块上
			this.falledStat.location = 0
		}
	}
	// 失败动画入口
	_falling() {
		// -10从当前方块落下，左前或者右前方 => leftTop rightTop
		// 10从下一个方块落下，分从方块前或后滑落 => leftTop leftBottom rightTop rightBottom
		// 0 只做下落，不做滚动
		if (this.falledStat.location === 10) {
			if (this.cubeStat.nextDirection === 'left') {
				if (this.jumper.position.x > this.cubes[this.cubes.length - 1].position.x) {
					// 距离没够
					this._fallingDir('leftBottom')
				} else {
					// 距离过了
					this._fallingDir('leftTop')
				}
			} else {
				if (this.jumper.position.z > this.cubes[this.cubes.length - 1].position.z) {
					// 距离没够
					this._fallingDir('rightBottom')
				} else {
					// 距离过了
					this._fallingDir('rightTop')
				}
			}
		} else if (this.falledStat.location === -10) {
			if (this.cubeStat.nextDirection === 'left') {
				this._fallingDir('leftTop')
			} else {
				this._fallingDir('rightTop')
			}
		} else if (this.falledStat.location === 0) {
			this._fallingDir('none')
		}
	}
	// 失败动画处理
	_fallingDir(dir) {
		// let offset = this.falledStat.distance - this.config.cubeWidth / 2
		let isRotate = true
		// 往左跳，绕着z轴旋转，往右跳，绕着x轴旋转
		let axis = dir.includes('left') ? 'z' : 'x'
		// rotation 模型角度属性
		let rotate = this.jumper.rotation[axis]
		// 下落高度
		let fallingTo = this.config.ground + this.config.jumperWidth / 2
		if (dir === 'leftTop') {
			rotate += 0.1
			// 旋转90度
			isRotate = this.jumper.rotation[axis] < Math.PI / 2
		} else if (dir === 'leftBottom') {
			rotate -= 0.1
			isRotate = this.jumper.rotation[axis] > -Math.PI / 2
		} else if (dir === 'rightTop') {
			rotate -= 0.1
			isRotate = this.jumper.rotation[axis] > -Math.PI / 2
		} else if (dir === 'rightBottom') {
			rotate += 0.1
			isRotate = this.jumper.rotation[axis] < Math.PI / 2
		} else if (dir === 'none') {
			// 下落-1
			fallingTo = this.config.ground
			isRotate = false
		}
		if (!this.fallingStat.end) {
			if (isRotate) {
				this.jumper.rotation[axis] = rotate
			} else if (this.jumper.position.y > fallingTo) {
				// 下落速度
				this.jumper.position.y -= this.fallingStat.speed
			} else {
				this.fallingStat.end = true
			}
			this._render()
			requestAnimationFrame(() => {
				this._falling()
			})
		} else {
			// 动画结束，显示失败弹窗
			if (this.failedCallback) {
				this.failedCallback()
			}
		}
	}
	// 设置相机位置和朝向
	_setCamera() {
		// 设置相机位置
		this.camera.position.set(100, 100, 100)
		// 设置相机方向
		this.camera.lookAt(this.cameraPos.current)
	}
	// 设置渲染器
	_setRenderer() {
		// 设置画布大小
		this.renderer.setSize(this.size.width, this.size.height)
		// 设置画布背景颜色
		this.renderer.setClearColor(this.config.background)
		//将画布追加到html文档中
		document.body.appendChild(this.renderer.domElement)
	}
	// 创建cube
	_createCube() {
		// 几何体
		let geometry = new THREE.CubeGeometry(this.config.cubeWidth, this.config.cubeHeight, this.config.cubeDeep)
		// 材质 => 反光材质
		let material = new THREE.MeshLambertMaterial({ color: this.config.cubeColor })
		// 网格模型 = 几何体 + 材质
		let cube = new THREE.Mesh(geometry, material)
		if (this.cubes.length) {
			// 随机一个方向生成cube
			this.cubeStat.nextDirection = Math.random() > 0.5 ? 'left' : 'right'
			cube.position.x = this.cubes[this.cubes.length - 1].position.x
			cube.position.y = this.cubes[this.cubes.length - 1].position.y
			cube.position.z = this.cubes[this.cubes.length - 1].position.z
			// left x轴的负方向 right z轴负方向
			if (this.cubeStat.nextDirection === 'left') {
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
		// Vector3 三维向量
		this.cameraPos.next = new THREE.Vector3((pointA.x + pointB.x) / 2, 0, (pointA.z + pointB.z) / 2)
	}
	// 改变相机的镜头，随着游戏进行，需要不断改变镜头聚焦位置，类似于聚光灯
	_updateCamera() {
		// 镜头还未移动到位
		if (this.cameraPos.current.x > this.cameraPos.next.x || this.cameraPos.current.z > this.cameraPos.next.z) {
			if (this.cubeStat.nextDirection === 'left') {
				// 如果左边生成，向左移动
				this.cameraPos.current.x -= 0.2
			} else {
				// 如果右边生成，向右移动
				this.cameraPos.current.z -= 0.2
			}
			// 小于0.05，直接一步到位
			if (this.cameraPos.current.x - this.cameraPos.next.x < 0.05) {
				this.cameraPos.current.x = this.cameraPos.next.x
			} else if (this.cameraPos.current.z - this.cameraPos.next.z < 0.05) {
				this.cameraPos.current.z = this.cameraPos.next.z
			}
			// 镜头对准current
			this.camera.lookAt(this.cameraPos.current)
			this._render()
			// 帧动画
			requestAnimationFrame(() => {
				this._updateCamera()
			})
		}
	}
	// 设置灯光
	_setLight() {
		// 添加平行光，类似太阳光
		let directionalLight = new THREE.DirectionalLight(0xffffff, 1.1)
		// 设置位置
		directionalLight.position.set(3, 10, 5)
		// add到场景中
		this.scene.add(directionalLight)
		// 添加环境光，增加亮度
		let light = new THREE.AmbientLight(0xffffff, 0.3)
		// add到场景中
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
		this.falledStat.location = -1
		this.fallingStat.end = false
		// 重置相机
		this.cameraPos = {
			current: new THREE.Vector3(0, 0, 0),
			next: new THREE.Vector3(0, 0, 0)
		}
		// 删除场景中的几何体
		this.scene.remove(this.jumper)
		// 循环remove
		this.cubes.forEach(cube => this.scene.remove(cube))
		this.cubes = []
		// 重新开始
		this._createCube()
		this._createCube()
		this._createJumper()
		this._updateCamera()
	}
}