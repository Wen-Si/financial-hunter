#!/bin/bash

echo "========================================"
echo "    🎮 金融猎手 - 快速启动脚本"
echo "========================================"
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查Docker是否安装
check_docker() {
    if command -v docker &> /dev/null; then
        if command -v docker-compose &> /dev/null; then
            return 0
        else
            echo -e "${RED}错误: docker-compose 未安装${NC}"
            return 1
        fi
    else
        echo -e "${RED}错误: Docker 未安装${NC}"
        return 1
    fi
}

# 安装依赖并启动（不使用Docker）
start_without_docker() {
    echo -e "${YELLOW}正在安装后端依赖...${NC}"
    cd server && npm install 2>&1 | tail -3
    
    echo -e "${YELLOW}正在安装前端依赖...${NC}"
    cd ../client && npm install 2>&1 | tail -3
    
    echo ""
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}    🎉 安装完成！${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo ""
    echo "请打开两个终端窗口："
    echo ""
    echo "终端1 - 启动后端服务："
    echo -e "  ${YELLOW}cd server && npm run dev${NC}"
    echo ""
    echo "终端2 - 启动前端服务："
    echo -e "  ${YELLOW}cd client && npm run dev${NC}"
    echo ""
    echo "然后访问: http://localhost:5173"
    echo ""
}

# 使用Docker启动
start_with_docker() {
    echo -e "${YELLOW}正在使用 Docker 启动服务...${NC}"
    docker-compose up -d
    
    echo ""
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}    🎉 服务启动成功！${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo ""
    echo "请访问: http://localhost:8080"
    echo ""
    echo "API服务运行在: http://localhost:3000"
    echo ""
    echo "停止服务: ${YELLOW}docker-compose down${NC}"
    echo ""
}

# 主菜单
echo "请选择启动方式："
echo ""
echo "1) 使用 Docker 启动 (推荐)"
echo "2) 本地安装依赖启动"
echo "3) 仅检查环境"
echo "4) 退出"
echo ""
read -p "请输入选项 [1-4]: " choice

case $choice in
    1)
        if check_docker; then
            start_with_docker
        else
            echo ""
            echo "请安装 Docker 后重试，或选择选项 2 进行本地安装"
        fi
        ;;
    2)
        start_without_docker
        ;;
    3)
        echo ""
        echo "检查环境..."
        echo ""
        
        echo -n "Node.js: "
        if command -v node &> /dev/null; then
            echo -e "${GREEN}✓$(node --version)${NC}"
        else
            echo -e "${RED}✗ 未安装${NC}"
        fi
        
        echo -n "npm: "
        if command -v npm &> /dev/null; then
            echo -e "${GREEN}✓$(npm --version)${NC}"
        else
            echo -e "${RED}✗ 未安装${NC}"
        fi
        
        echo -n "Docker: "
        if command -v docker &> /dev/null; then
            echo -e "${GREEN}✓ 已安装${NC}"
        else
            echo -e "${RED}✗ 未安装${NC}"
        fi
        
        echo -n "docker-compose: "
        if command -v docker-compose &> /dev/null; then
            echo -e "${GREEN}✓ 已安装${NC}"
        else
            echo -e "${RED}✗ 未安装${NC}"
        fi
        ;;
    4)
        echo "再见！"
        exit 0
        ;;
    *)
        echo -e "${RED}无效的选项${NC}"
        exit 1
        ;;
esac
