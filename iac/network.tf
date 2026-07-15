resource "aws_vpc" "Main" {
  tags       = { Name = "${var.Project} VPC" }
  cidr_block = "10.0.0.0/24"
}

resource "aws_subnet" "Main" {
  for_each = toset(local.Zone)

  tags                    = { Name = "${var.Project} Subnet ${index(local.Zone, each.key) + 1}" }
  vpc_id                  = aws_vpc.Main.id
  cidr_block              = cidrsubnet(aws_vpc.Main.cidr_block, 4, index(local.Zone, each.key))
  availability_zone       = each.key
  map_public_ip_on_launch = true
}

resource "aws_internet_gateway" "Main" {
  tags   = { Name = "${var.Project} Gateway" }
  vpc_id = aws_vpc.Main.id
}

resource "aws_default_route_table" "Main" {
  tags                   = { Name = "${var.Project} Table" }
  default_route_table_id = aws_vpc.Main.default_route_table_id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.Main.id
  }
}

resource "aws_default_security_group" "Main" {
  tags   = { Name = "${var.Project} Firewall" }
  vpc_id = aws_vpc.Main.id
}
