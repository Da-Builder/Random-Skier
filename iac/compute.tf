resource "aws_autoscaling_group" "Main" {
  name                = "${var.Project} Group"
  min_size            = 0
  max_size            = 1
  default_cooldown    = 0
  vpc_zone_identifier = [for subnet in aws_subnet.Main : subnet.id]

  launch_template {
    id      = aws_launch_template.Main.id
    version = "$Latest"
  }

  tag {
    key                 = "Project"
    value               = var.Project
    propagate_at_launch = true
  }
}

resource "aws_autoscaling_policy" "Main" {
  for_each = { Up = 1, Down = -1 }

  name                   = "Scale ${each.key}"
  autoscaling_group_name = aws_autoscaling_group.Main.id
  policy_type            = "SimpleScaling"
  adjustment_type        = "ChangeInCapacity"
  scaling_adjustment     = each.value
}

resource "aws_launch_template" "Main" {
  name          = "${var.Project}-Template"
  image_id      = "ami-0aa77def67762002c"
  instance_type = "t3.micro"
}
